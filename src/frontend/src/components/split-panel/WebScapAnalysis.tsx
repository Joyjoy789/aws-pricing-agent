import {
    Badge,
    Box,
    Button,
    Container,
    Header,
    KeyValuePairs,
    Link,
    Modal,
    ProgressBar,
    SpaceBetween,
    Spinner,
    Tiles,
} from "@cloudscape-design/components";
import { useMemo, useState } from "react";
import Logo from "../../assets/bedrock_brain.png";
import { QUERY_KEYS, WebScrapType } from "../../utilities/types";
import { useS3ListItems } from "../../hooks/useStorage";
import { AppRoutes } from "../../pages/PageNavigation";
import { useNavigate } from "react-router-dom";
interface WebScrapAnalysisProps {
    webScrap: string;
}
export const WebScrapAnalysis = (props: WebScrapAnalysisProps) => {
    const { webScrap } = props;
    const navigate = useNavigate();
    const [value, setValue] = useState("");
    const [visible, setVisible] = useState(false);
    const webScrapJson = useMemo(() => JSON.parse(webScrap) as WebScrapType, [webScrap]);
    const { data: snaps, isLoading: isLoadingSnaps } = useS3ListItems(QUERY_KEYS.WEB_SCRAP);

    const snapshots = useMemo(() => {
        if (!snaps) return [];
        return snaps.map((snap) => {
            return {
                label: snap.itemName.split("/").pop()?.split(".")[0],
                image: <img src={snap.url} alt="placeholder" width={"100%"} />,
                value: snap.itemName,
            };
        });
    }, [snaps]);

    const url = useMemo(() => {
        const url = snapshots.find((s) => s.value === value)?.image;
        return url?.props.src ?? Logo;
    }, [value]);

    const competitorUrl = useMemo(() => {
        if (!webScrapJson.primaryCompetitor) return "#";
        if (
            webScrapJson.primaryCompetitor.toLowerCase().includes("tool") ||
            webScrapJson.primaryCompetitor.toLowerCase().includes("master")
        ) {
            return AppRoutes.competitor.href.replace(
                ":name",
                QUERY_KEYS.TOOL_MASTER.replace("_", "-").toLowerCase()
            );
        } else if (
            webScrapJson.primaryCompetitor.toLowerCase().includes("builder") ||
            webScrapJson.primaryCompetitor.toLowerCase().includes("depot")
        ) {
            return AppRoutes.competitor.href.replace(
                ":name",
                QUERY_KEYS.BUILDER_DEPOT.replace("_", "-").toLowerCase()
            );
        }
    }, [webScrapJson.primaryCompetitor]);

    return (
        <SpaceBetween size="m">
            <Container>
                <KeyValuePairs
                    columns={3}
                    items={[
                        {
                            type: "group",
                            title: "Suggested Pricing",
                            items: [
                                {
                                    label: "Recommended price",
                                    value: (
                                        <Badge color="blue">
                                            ${webScrapJson.competitorTotalCost ?? "-"}
                                        </Badge>
                                    ),
                                },
                                {
                                    label: "Min price",
                                    value: (
                                        <Badge color="green">
                                            ${webScrapJson.lowestMarketPrice ?? "-"}
                                        </Badge>
                                    ),
                                },
                                {
                                    label: "Max price",
                                    value: (
                                        <Badge color="severity-medium">
                                            ${webScrapJson.highestMarketPrice ?? "-"}
                                        </Badge>
                                    ),
                                },
                            ],
                        },
                        {
                            type: "group",
                            title: "Competitor Statistics",
                            items: [
                                {
                                    label: "Average Market price",
                                    value: (
                                        <Badge color="blue">
                                            ${webScrapJson.averageMarketPrice ?? "-"}
                                        </Badge>
                                    ),
                                },
                                {
                                    label: "Highest Market Price",
                                    value: (
                                        <Badge color="red">
                                            ${webScrapJson.highestMarketPrice ?? "-"}
                                        </Badge>
                                    ),
                                },
                                {
                                    label: "Lowest Market Price",
                                    value: (
                                        <Badge color="severity-medium">
                                            ${webScrapJson.lowestMarketPrice ?? "-"}
                                        </Badge>
                                    ),
                                },
                            ],
                        },
                        {
                            type: "group",
                            title: "Market Assessment",
                            items: [
                                {
                                    label: "Primary Competitor",
                                    value: (
                                        <Link onClick={() => navigate(competitorUrl ?? "#")}>
                                            {webScrapJson.primaryCompetitor ?? "-"}
                                        </Link>
                                    ),
                                },
                                {
                                    label: "Market Position",
                                    value: `${webScrapJson.marketPositionAssessment ?? "-"}`,
                                },
                                {
                                    label: "Confidence Score",
                                    value: (
                                        <ProgressBar
                                            ariaLabelledby="confidence-score-id"
                                            value={webScrapJson.matchConfidenceScore ?? 0}
                                            variant="key-value"
                                        />
                                    ),
                                },
                            ],
                        },
                    ]}
                />
            </Container>
            <Container
                header={
                    <Header
                        variant="h3"
                        description={
                            "View screen grabs taken by the web scraping agent from various competitor sites ."
                        }
                    >
                        Competitor Sites
                    </Header>
                }
            >
                {isLoadingSnaps ? (
                    <Spinner />
                ) : (
                    <Tiles
                        onChange={(props) => {
                            setValue(props.detail.value);
                            setVisible(true);
                        }}
                        value={value}
                        columns={4}
                        items={snapshots}
                    />
                )}
            </Container>
            <Modal
                size="large"
                onDismiss={() => setVisible(false)}
                visible={visible}
                footer={
                    <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                            <Button onClick={() => setVisible(false)} variant="primary">
                                Close
                            </Button>
                        </SpaceBetween>
                    </Box>
                }
                header="Website Snapshot"
            >
                <img src={url} alt="web_scrap" width={"100%"} height={"100%"} />
            </Modal>
        </SpaceBetween>
    );
};
