export function droppedEvent(info, calendar) {
    console.log('Event dropped:', info);

    let resourceId = info.event._def.resourceIds[0];
    let resource = calendar.getResourceById(resourceId);

    if (resource) {
        let resourceName = resource.title;
        alert(info.event.title + ' was dropped on ' + info.event.start + ' and is now assigned to ' + resourceName);
        console.log(info.event.start);
        console.log('Assigned to smed:', resourceName);
    } else {
        alert(info.event.title + ' was dropped, but no associated resource found.');
    }
}

export function resizedEvent(info, calendar) {
    alert(info.event.title + ' was resized to ' + info.event.start + ' - ' + info.event.end);
}
