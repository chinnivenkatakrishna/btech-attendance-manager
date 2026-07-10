export const colorMap = {
    blue: 'var(--accent-blue)',
    purple: 'var(--accent-purple)',
    teal: 'var(--accent-teal)',
    emerald: 'var(--accent-emerald)',
    orange: 'var(--accent-orange)',
    pink: 'var(--accent-pink)'
};

export const calculateAttendanceStats = (attended, conducted, target = 75) => {
    if (conducted === 0) {
        return {
            percentage: 0,
            status: 'safe',
            statusLabel: 'Safe',
            message: 'No classes conducted yet. Perfect record!',
            needsToAttend: 0,
            canMiss: 0
        };
    }

    const percentage = parseFloat(((attended / conducted) * 100).toFixed(1));

    if (percentage >= target) {
        let canMiss = 0;
        if (target > 0) {
            canMiss = Math.floor((100 * attended - target * conducted) / target);
        }
        return {
            percentage,
            status: 'safe',
            statusLabel: 'Safe',
            message: canMiss > 0 
                ? `You can safely miss the next ${canMiss} class${canMiss > 1 ? 'es' : ''}.` 
                : `You cannot miss any classes. One miss will drop you below ${target}%.`,
            needsToAttend: 0,
            canMiss
        };
    } else {
        let needsToAttend = 0;
        if (100 - target > 0) {
            needsToAttend = Math.ceil((target * conducted - 100 * attended) / (100 - target));
        }
        return {
            percentage,
            status: percentage < 50 ? 'danger' : 'warning',
            statusLabel: percentage < 50 ? 'Danger' : 'Warning',
            message: `You must attend the next ${needsToAttend} class${needsToAttend > 1 ? 'es' : ''} consecutively to reach ${target}%.`,
            needsToAttend,
            canMiss: 0
        };
    }
};

export const formatBunkDate = (dateObj = new Date()) => {
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    return dateObj.toLocaleDateString('en-US', options);
};

export const getDateForWeekday = (dayName, weekOffset = 0) => {
    const dayOffsets = {
        'Monday': 0,
        'Tuesday': 1,
        'Wednesday': 2,
        'Thursday': 3,
        'Friday': 4,
        'Saturday': 5,
        'Sunday': -1
    };
    
    const targetOffset = dayOffsets[dayName];
    if (targetOffset === undefined) return new Date();

    const today = new Date();
    const todayIndex = today.getDay();
    
    const daysSinceMonday = todayIndex === 0 ? 6 : todayIndex - 1;

    const resultDate = new Date(today);
    resultDate.setDate(today.getDate() - daysSinceMonday + targetOffset + (weekOffset * 7));
    return resultDate;
};
