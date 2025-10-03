

export const getNameAvatar = (name) => {
    if(!name) return 'EX';
    const [firstname,lastname] = name.split(' ');
    return `${firstname?.slice(0,1)?.toUpperCase() || ''}${lastname?.slice(0,1)?.toUpperCase() || ''}`;
}