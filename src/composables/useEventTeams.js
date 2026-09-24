import { computed } from 'vue';

/**
 * Composable for parsing event names and extracting team names
 * @param {string} eventName - The event name to parse
 * @returns {Object} - Object containing team names and parsing info
 */
export function useEventTeams(eventName) {
    const teams = computed(() => {
        if (!eventName || typeof eventName !== 'string') {
            return {
                team1: '',
                team2: '',
                separator: '',
                hasSeparator: false,
                originalName: eventName || ''
            };
        }

        // Define separators to look for (with spaces around them)
        const separators = [
            ' vs ',
            ' vs. ',
            ' v ',
            ' VS ',
            ' VS. ',
            ' V '
        ];

        // Find the first matching separator
        let foundSeparator = '';
        let separatorIndex = -1;

        for (const separator of separators) {
            const index = eventName.indexOf(separator);
            if (index !== -1) {
                foundSeparator = separator;
                separatorIndex = index;
                break;
            }
        }

        // If no separator found, return the whole name as team1
        if (separatorIndex === -1) {
            return {
                team1: eventName.trim(),
                team2: '',
                separator: '',
                hasSeparator: false,
                originalName: eventName
            };
        }

        // Split the event name using the found separator
        const team1 = eventName.substring(0, separatorIndex).trim();
        const team2 = eventName.substring(separatorIndex + foundSeparator.length).trim();

        return {
            team1,
            team2,
            separator: foundSeparator,
            hasSeparator: true,
            originalName: eventName
        };
    });

    // Helper function to get teams as array
    const teamsArray = computed(() => {
        const result = teams.value;
        if (result.hasSeparator) {
            return [result.team1, result.team2];
        }
        return [result.team1];
    });

    // Helper function to check if event has two teams
    const hasTwoTeams = computed(() => teams.value.hasSeparator);

    // Helper function to get formatted display name
    const displayName = computed(() => {
        const result = teams.value;
        if (result.hasSeparator) {
            return `${result.team1} vs ${result.team2}`;
        }
        return result.team1;
    });

    return {
        teams,
        teamsArray,
        hasTwoTeams,
        displayName
    };
}

/**
 * Standalone function version for use outside of Vue components
 * @param {string} eventName - The event name to parse
 * @returns {Object} - Object containing team names and parsing info
 */
export function parseEventTeams(eventName) {
    if (!eventName || typeof eventName !== 'string') {
        return {
            team1: '',
            team2: '',
            separator: '',
            hasSeparator: false,
            originalName: eventName || '',
            teamsArray: [eventName || ''],
            hasTwoTeams: false,
            displayName: eventName || ''
        };
    }

    // Define separators to look for (with spaces around them)
    const separators = [
        ' vs ',
        ' vs. ',
        ' v ',
        ' VS ',
        ' VS. ',
        ' V '
    ];

    // Find the first matching separator
    let foundSeparator = '';
    let separatorIndex = -1;

    for (const separator of separators) {
        const index = eventName.indexOf(separator);
        if (index !== -1) {
            foundSeparator = separator;
            separatorIndex = index;
            break;
        }
    }

    // If no separator found, return the whole name as team1
    if (separatorIndex === -1) {
        return {
            team1: eventName.trim(),
            team2: '',
            separator: '',
            hasSeparator: false,
            originalName: eventName,
            teamsArray: [eventName.trim()],
            hasTwoTeams: false,
            displayName: eventName.trim()
        };
    }

    // Split the event name using the found separator
    const team1 = eventName.substring(0, separatorIndex).trim();
    const team2 = eventName.substring(separatorIndex + foundSeparator.length).trim();

    return {
        team1,
        team2,
        separator: foundSeparator,
        hasSeparator: true,
        originalName: eventName,
        teamsArray: [team1, team2],
        hasTwoTeams: true,
        displayName: `${team1} vs ${team2}`
    };
}
