import {
    Authenticator,
    Button,
    Heading,
    useAuthenticator,
    useTheme,
    View,
    Text,
    Flex,
} from "@aws-amplify/ui-react";
import { Box, Container, Button as CSButton } from "@cloudscape-design/components";
import { Amplify } from "aws-amplify";
import { fetchAuthSession, signInWithRedirect } from "aws-amplify/auth";
import { isLocalhost } from "./utilities";
import SplashLogo from "./assets/bedrock_brain.png";
import { AppBase } from "./pages/AppBase";
import { appName } from "./atoms/AppAtoms";

const apiConfig = {
    headers: async () => {
        return {
            Authorization: (await fetchAuthSession()).tokens?.idToken?.toString() ?? "",
        };
    },
};

Amplify.configure(
    {
        Auth: {
            Cognito: {
                userPoolId: import.meta.env.VITE_USER_POOL_ID,
                userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
                identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID, // REQUIRED only for Federated Authentication
                allowGuestAccess: false,
                // OPTIONAL - Set to true to use your identity pool's unauthenticated role for unauthenticated users.
                loginWith: {
                    // OPTIONAL - Hosted UI configuration
                    oauth: {
                        domain: import.meta.env.VITE_USER_POOL_DOMAIN_URL,
                        scopes: ["openid"],
                        redirectSignIn: isLocalhost
                            ? ["http://localhost:3000"]
                            : [import.meta.env.VITE_CALLBACK_URL],
                        redirectSignOut: isLocalhost
                            ? ["http://localhost:3000"]
                            : [import.meta.env.VITE_CALLBACK_URL],
                        responseType: "code", //REFRESH token will only be generated when the responseType is code.
                    },
                },
            },
        },
        API: {
            GraphQL: {
                endpoint: import.meta.env.VITE_GRAPH_API_URL,
                defaultAuthMode: "userPool",
            },
            REST: {
                restApi: {
                    endpoint: String(import.meta.env.VITE_REST_API_URL).slice(0, -1),
                },
            },
        },
        Storage: {
            S3: {
                bucket: import.meta.env.VITE_STORAGE_BUCKET_NAME,
                region: import.meta.env.VITE_REGION,
            },
        },
    },
    {
        API: {
            GraphQL: apiConfig,
            REST: apiConfig,
        },
    }
);

export default function App() {
    const components = {
        Header() {
            const { tokens } = useTheme();
            return (
                <View
                    as="div"
                    ariaLabel="View example"
                    borderRadius="2vw"
                    textAlign="center"
                    padding={tokens.space.medium}
                >
                    <Flex direction="column" textAlign="center" alignItems={"center"}>
                        <img
                            src={SplashLogo}
                            alt="Logo"
                            height={"50%"}
                            width={"50%"}
                            style={{
                                borderRadius: "1vw",
                            }}
                        />
                        <Box variant="h1" textAlign="center">
                            {appName}
                        </Box>
                        <Flex
                            direction={"row"}
                            width={"100%"}
                            paddingTop={"1vh"}
                            paddingBottom={"1vh"}
                        >
                            <div
                                style={{
                                    flexGrow: 1,
                                    height: "2px",
                                    backgroundColor: "black",
                                }}
                            />
                        </Flex>
                        {import.meta.env.VITE_USER_POOL_DOMAIN_URL && (
                            <>
                                <Container fitHeight>
                                    <CSButton
                                        onClick={() => signInWithRedirect()}
                                        iconName="lock-private"
                                        variant="primary"
                                    >
                                        Login with Midway
                                    </CSButton>
                                </Container>
                                <Box
                                    color="text-body-secondary"
                                    textAlign="center"
                                    fontWeight="bold"
                                    fontSize="heading-m"
                                >
                                    OR
                                </Box>
                            </>
                        )}
                    </Flex>
                </View>
            );
        },
        Footer() {
            const { tokens } = useTheme();
            return (
                <View textAlign="center" padding={tokens.space.large}>
                    <Text color={tokens.colors.black}>&copy; All Rights Reserved</Text>
                </View>
            );
        },
        SignIn: {
            Header() {
                const { tokens } = useTheme();
                return (
                    <Heading
                        padding={`${tokens.space.small} 0 0 ${tokens.space.small}`}
                        level={6}
                        style={{ textAlign: "center" }}
                    >
                        Login with Amazon Cognito
                    </Heading>
                );
            },
            Footer() {
                const { toForgotPassword } = useAuthenticator();
                return (
                    <View textAlign="center">
                        <Button
                            fontWeight="normal"
                            onClick={toForgotPassword}
                            size="small"
                            variation="link"
                        >
                            Reset Password
                        </Button>
                    </View>
                );
            },
        },
    };

    const formFields = {
        signIn: {
            username: {
                isRequired: true,
                label: "Email:",
                placeholder: "Enter your email",
            },
        },
        resetPassword: {
            username: {
                type: "email",
                isRequired: true,
                label: "Email:",
                placeholder: "Enter your email",
            },
        },
    };

    return (
        <div
            style={{
                background:
                    "linear-gradient(90deg, rgba(92,86,189,0.3295693277310925) 22%, rgba(104,136,149,0.33) 51%, rgba(110,185,200,1) 100%)",
                minHeight: "100vh",
                // minWidth: "100vw",
                // width: "100%"
                //overflow: 'hidden',
                // alignItems: "center",
                // justifyContent: "center",
            }}
        >
            <Authenticator formFields={formFields} hideSignUp={true} components={components}>
                <AppBase />
            </Authenticator>
        </div>
    );
}
