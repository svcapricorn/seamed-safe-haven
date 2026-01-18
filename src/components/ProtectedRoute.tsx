import React, { useEffect, useState } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import { Outlet } from 'react-router-dom';
import { CircularProgress, Box, Alert, AlertTitle, Button } from '@mui/material';

const ProtectedRoute = () => {
    const { oktaAuth, authState } = useOktaAuth();
    const [loginError, setLoginError] = useState<Error | null>(null);
    const isMockAuth = import.meta.env.VITE_MOCK_AUTH === 'true';

    useEffect(() => {
        if (isMockAuth) {
             console.log("Mock Auth Enabled - Skipping Okta");
             return;
        }

        if (!authState) {
            return;
        }

        if (!authState?.isAuthenticated) {
            const originalUri = window.location.pathname;
            oktaAuth.setOriginalUri(originalUri);
            oktaAuth.signInWithRedirect().catch(err => {
                console.error("Okta Login Failed:", err);
                setLoginError(err);
            });
        }
    }, [oktaAuth, !!authState, authState?.isAuthenticated]);

    if (isMockAuth) {
        return <Outlet />;
    }

    if (loginError) {
        return (
            <Box sx={{ 
                display: 'flex', 
                height: '100vh', 
                justifyContent: 'center', 
                alignItems: 'center',
                p: 2
            }}>
                <Alert 
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                            Retry
                        </Button>
                    }
                >
                    <AlertTitle>Authentication Error</AlertTitle>
                    {loginError.message}
                    <Box sx={{ mt: 1, fontSize: '0.85em', opacity: 0.9 }}>
                        Check that your Okta Application is configured as a <strong>Single Page App (SPA)</strong> and PKCE is enabled.
                    </Box>
                </Alert>
            </Box>
        );
    }

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
