import { ContentLayout, Container, Box, Grid } from "@cloudscape-design/components";

import { ProductSelector } from "../components/home/ProductSelector";
import { DisclaimerModal } from "../components/DisclaimerModal";

export const Home = () => {
    return (
        <ContentLayout
            headerVariant="high-contrast"
            defaultPadding
            // add box shadow
            headerBackgroundStyle="linear-gradient(166deg, rgba(101,27,182,0.8365721288515406) 25%, rgba(53,106,177,0.8533788515406162) 50%, rgba(13,86,170,0.8645833333333334) 86%)"
            header={
                <Box padding={{ vertical: "xxxl" }}>
                    <Grid gridDefinition={[{ colspan: { default: 12, s: 8 } }]}>
                        <Container>
                            <Box padding="s">
                                <Box
                                    fontSize="display-l"
                                    fontWeight="bold"
                                    variant="h1"
                                    padding="n"
                                >
                                    Retail Pricing Assistant
                                </Box>
                                <Box fontSize="display-l" fontWeight="light">
                                    Powered by Amazon Bedrock Agents
                                </Box>
                                <Box
                                    variant="p"
                                    color="text-body-secondary"
                                    margin={{ top: "xs", bottom: "l" }}
                                >
                                    Revolutionizing retail pricing through collaborative AI
                                    intelligence.
                                </Box>
                            </Box>
                        </Container>
                    </Grid>
                </Box>
            }
        >
            <ProductSelector />
            <DisclaimerModal />
        </ContentLayout>
    );
};
