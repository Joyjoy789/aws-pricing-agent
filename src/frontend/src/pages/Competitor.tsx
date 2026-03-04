import { ContentLayout, Box, Container, Grid } from "@cloudscape-design/components";
import tool_master_banner from "../assets/tool_master_banner.jpeg";
import builders_depot_banner from "../assets/builders_depot_banner.jpeg";
import { useLocation } from "react-router-dom";
import { StoreItems } from "../components/competitor/StoreItems";
import { QUERY_KEYS } from "../utilities/types";

export const Competitor = () => {
    const { pathname } = useLocation();
    return (
        <ContentLayout
            headerVariant="high-contrast"
            defaultPadding
            headerBackgroundStyle={(mode) =>
                `linear-gradient(rgba(128, 128, 128, 0.5), rgba(128, 128, 128, 0.5)), center center/cover url(${pathname.includes("tool-master") ? tool_master_banner : builders_depot_banner})`
            }
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
                                    {pathname
                                        .split("/")
                                        .pop()
                                        ?.split("-")
                                        .join(" ")
                                        .toLocaleUpperCase()}
                                </Box>
                                <Box fontSize="display-l" fontWeight="light">
                                    {pathname.includes("tool-master")
                                        ? "Where DIY Dreams Take Shape"
                                        : "Your Project. Our Warehouse. Endless Possibilities."}
                                </Box>
                                <Box
                                    variant="p"
                                    color="text-body-secondary"
                                    margin={{ top: "xs", bottom: "l" }}
                                >
                                    {pathname.includes("tool-master")
                                        ? "Our cost-effective hardware store blends professional expertise with a modern shopping experience, offering a wide range of quality tools and materials for both DIY enthusiasts and contractors. "
                                        : "Step into our expansive warehouse where contractors and homeowners discover an unmatched selection of building materials, industrial-grade tools, and specialized equipment at wholesale prices."}
                                </Box>
                            </Box>
                        </Container>
                    </Grid>
                </Box>
            }
        >
            <StoreItems
                storeName={
                    pathname.includes("tool-master")
                        ? QUERY_KEYS.TOOL_MASTER
                        : QUERY_KEYS.BUILDER_DEPOT
                }
            />
        </ContentLayout>
    );
};
