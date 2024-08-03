const ErrMessages = {
    insufficientPermissions: 'Insufficient permissions',
    unauthenticated: 'Not authenticated',
    internalError: 'Internal server error',

    sessionRoute: {
        wrongCredentials: 'Incorrect credentials',
        genericError: 'There was an error during the login',
        disabled: 'Your account has been disabled',
    },

    userRoutes: {
        creationError: 'Error in creating the user',
    },

    eventRoutes: {
        creationError: 'Error in creating the event',
        notFoundError: 'Event not found',
    },

    activityRoutes: {
        creationError: 'Error in creating the activity',
        editError: 'Error in editing the activity',
    },

    roomRoutes: {
        creationError: 'Error in creating the room',
        editError: 'Error in editing the room',
        notFoundError: 'Room not found',
    },

    classes: {
        eventDeleteRestriction:
            'An event that is active, or already has happened can\'t be deleted from the database',
        activityDeleteRestriction: {
            hasRegistrys: 'This activity has registred users',
            eventIsHappening: 'The event of this activity is happening',
            eventHasHappened: 'An event that has happened can\'t have its activities deleted',
        },
        endDateBeforeStartDateError:
            'Event is being assigned with end date before start date.',
        endDateBeforeStartDateRegistryError:
            'Event registry date is being assigned with end date before start date.',
        eventChangeRestriction:
            'Activity\'s event cannot be changed',
        userCannotBeDeleted:
            'User is active and cannot be deleted',
        userCannotBeDisabled:
            'User is responsible in a future or ongoing event or activity and cannot be disabled',
        userCannotBeReEnabled:
            'User is not disabled and cannot be reenabled',
    },

    categoryRoutes: {
        creationError: 'Error in creating the category',
        editError: 'Error in editing the category',
        notFoundError: 'Event category not found',
    },
    
    areaRoutes: {
        creationError: 'Error in creating the area',
        editError: 'Error in editing the area',
        notFoundError: 'Event area not found',
    },
};

export default ErrMessages;
