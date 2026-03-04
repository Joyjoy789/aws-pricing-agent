import React from "react";
import { Box, Container, Header, SpaceBetween } from "@cloudscape-design/components";

const NotFound404: React.FC = () => {
    return (
        <Container>
            <Box padding="xl" textAlign="center">
                <SpaceBetween size="l">
                    <Header
                        variant="h1"
                        className="error-code"
                        actions={
                            <style>
                                {`
                .error-code {
                  font-size: 8em !important;
                  color: #333;
                  animation: bounce 2s ease infinite;
                }
                
                .astronaut {
                  font-size: 5em;
                  animation: float 5s ease-in-out infinite;
                  margin: 20px 0;
                  display: inline-block;
                }
                
                @keyframes bounce {
                  0%, 100% {
                    transform: translateY(0);
                  }
                  50% {
                    transform: translateY(-20px);
                  }
                }
                
                @keyframes float {
                  0%, 100% {
                    transform: translateY(0) rotate(0deg);
                  }
                  50% {
                    transform: translateY(-20px) rotate(5deg);
                  }
                }
              `}
                            </style>
                        }
                    >
                        Houston we have a problem!!
                    </Header>

                    <Box variant="p" fontSize="heading-xl" color="text-body-secondary">
                        Oops! The page you're looking for has floated away.
                    </Box>

                    <div className="astronaut">👨‍🚀</div>
                </SpaceBetween>
            </Box>
        </Container>
    );
};

export default NotFound404;
