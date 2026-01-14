import React, { useEffect } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import { Outlet } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = () => {
    const { oktaAuth, authState } = useOktaAuth();

    useEffect(() => {
        if (!authState) {
            return;
        }

        if (!authState?.isAuthenticated) {
            const originalUri = window.location.pathname;
            oktaAuth.setOriginalUri(originalUri);
            oktaAuth.signInWithRedirect();
        }
    }, [oktaAuth, !!authState, authState?.isAuthenticated]);

    if (!authState || !authState?.isAuthenticated) {
        return (
            <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return <Outlet />;
};

export default ProtectedRoute;
