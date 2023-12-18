export function formatDateEuropean(dateString, withTime) {
    const date = new Date(dateString);

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    if (withTime) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${day}/${month}-${year} ${hours}:${minutes}`;
    } else {
        return `${day}/${month}-${year}`;
    }
}

export function formatDateUS(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

export function subtractOneDay(dateString) {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1);
    return date;
}

export function addOneDay(dateString) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date;
}
