const colors = {
    a: "#ff5733", // Bright orange
    b: "#33a1ff", // Sky blue
    c: "#28a745", // Green
    d: "#ffc107", // Amber
    e: "#6f42c1", // Purple
    f: "#dc3545", // Red
    g: "#20c997", // Teal
    h: "#fd7e14", // Vibrant orange
    i: "#6610f2", // Deep purple
    j: "#17a2b8", // Cyan
    k: "#e83e8c", // Pink
    l: "#007bff", // Blue
    m: "#28a745", // Green
    n: "#fdc500", // Yellow
    o: "#343a40", // Dark gray
    p: "#495057", // Slate gray
    q: "#6c757d", // Light gray
    r: "#adb5bd", // Neutral gray
    s: "#ff6f61", // Coral
    t: "#ffb400", // Sunflower
    u: "#39a9db", // Soft blue
    v: "#4caf50", // Light green
    w: "#f50057", // Magenta
    x: "#9c27b0", // Violet
    y: "#ff9800", // Warm orange
    z: "#607d8b", // Muted blue-gray
};



export const getColorByFirstLetter = (name) => {
    if(!name) return colors[0];
    const firstletter = name[0].toLowerCase();

    return colors[firstletter];
}