import pool from './mysqlConnection.js';
import { hashPassword, comparePassword, isValidPassword } from '../../utils/password.js';

//let user = await createUser('CHRISTIAN', 'CHRISTIAN@test.dk', 'Bowie2018');
//let user = await checkAndChangePassword('Jhon1989', 'Jonathan123', 'Bowie2018');
//let user = await loginUser('Jhon', 'Jonathan123');
//let user = await editProfile('Jhon', 'Jhon1989', 'Tesqwet@test.dk', 'willumsenjonathan@gmail.com');
//console.log('User: ', user);

export async function createUser(username, email, password, role = 'user') {
    username = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase().replace(/\s/g, '');
    email = email.charAt(0).toUpperCase() + email.slice(1).toLowerCase();

    try {
        if (isValidPassword(password)) {
            console.log('Password is valid.');
        }
    } catch (error) {
        throw new Error(error.message);
    }

    let hashedPassword = await hashPassword(password);

    const createdAt = new Date();
    const updatedAt = new Date();
    const newUser = {
        username,
        email,
        hashedPassword,
        role,
        createdAt,
        updatedAt,
    };

    try {
        const [result] = await pool.execute(`INSERT INTO users (username, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`, [
            username,
            email,
            hashedPassword,
            role,
            createdAt,
            updatedAt,
        ]);
        console.log('result: ', result);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.sqlMessage.includes('users.username_UNIQUE')) {
                throw new Error('Username already exists');
            } else if (error.sqlMessage.includes('users.email_UNIQUE')) {
                throw new Error('Email already exists');
            }
        }
        throw error;
    }

    const { password: _, ...userWithoutPassword } = newUser;

    return userWithoutPassword;
}

export async function loginUser(loginInput, password) {
    if (loginInput.includes('@')) {
        loginInput = loginInput.charAt(0).toUpperCase() + loginInput.slice(1).toLowerCase();
    } else {
        loginInput = loginInput.charAt(0).toUpperCase() + loginInput.slice(1).toLowerCase().replace(/\s/g, '');
    }

    const [result] = await pool.execute(`SELECT * FROM users WHERE username = ? OR email = ?`, [loginInput, loginInput]);

    if (result.length === 0) {
        throw new Error('User not found');
    }

    const user = result[0];

    const isPasswordCorrect = await comparePassword(password, user.password);

    if (!isPasswordCorrect) {
        throw new Error('Wrong password');
    }

    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
}

export async function checkAndChangePassword(username, oldPassword, newPassword) {
    username = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase().replace(/\s/g, '');

    const [result] = await pool.execute(`SELECT * FROM users WHERE username = ?`, [username]);

    if (result.length === 0) {
        throw new Error('User not found');
    }

    const user = result[0];

    const isPasswordCorrect = await comparePassword(oldPassword, user.password);

    if (!isPasswordCorrect) {
        throw new Error('Wrong password');
    }

    if (!isValidPassword(newPassword)) {
        throw new Error('Password is not valid');
    }

    const hashedPassword = await hashPassword(newPassword);

    const [updateResult] = await pool.execute(`UPDATE users SET password = ?, updatedAt = Now() WHERE username = ?`, [hashedPassword, username]);

    if (updateResult.affectedRows === 0) {
        throw new Error('Could not update password');
    }

    //return user without password

    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
}

export async function getAllUsersWithUserRole() {
    const [result] = await pool.execute(`SELECT * FROM users WHERE role = 'user'`);
    return result;
}

export async function getAllUsers() {
    const [result] = await pool.execute(`SELECT * FROM users`);
    return result;
}

export async function editProfile(oldUsername, newUsername, oldEmail, newEmail) {
    newUsername = newUsername.charAt(0).toUpperCase() + newUsername.slice(1).toLowerCase().replace(/\s/g, '');
    newEmail = newEmail.charAt(0).toUpperCase() + newEmail.slice(1).toLowerCase();

    const [existingUsers] = await pool.query(
        'SELECT id FROM users WHERE (username = ? AND id != (SELECT id FROM users WHERE username = ?)) OR (email = ? AND id != (SELECT id FROM users WHERE email = ?))',
        [newUsername, oldUsername, newEmail, oldEmail]
    );

    if (existingUsers.length > 0) {
        existingUsers.forEach(user => {
            if (user.username === newUsername) {
                throw new Error('Username already exists');
            } else if (user.email === newEmail) {
                throw new Error('Email already exists');
            }
        });
    }

    // Update user's profile
    await pool.query('UPDATE users SET username = ?, email = ?, updatedAt = NOW() WHERE username = ?', [newUsername, newEmail, oldUsername]);

    // Commit the transaction

    const [updatedUser] = await pool.query('SELECT id, username, email, role, createdAt, updatedAt FROM users WHERE username = ?', [newUsername]);

    return updatedUser[0];
}
