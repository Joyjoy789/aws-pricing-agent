import { useCallback, useEffect, useMemo } from "react";
import { ColumnLayout, Container, Header } from "@cloudscape-design/components";
import { MultiAgentFlow } from "../components/pricing/MultiAgentFlow";
import { useGetPricing } from "../hooks/useApi";
import { generateClient } from "aws-amplify/api";
import { onPricingById } from "../graphql/subscriptions";
import { useParams } from "react-router-dom";
import { ChatMessages } from "../components/pricing/ChatMessages";
import { BotMessage, Messages } from "../utilities/types";
import { useAtom, useSetAtom } from "jotai";
import { hideSplitPanelAtom, notificationAtom } from "../atoms/AppAtoms";

export const Pricing = () => {
    const { id: sessionID } = useParams();
    const { data, refetch } = useGetPricing(sessionID ?? "");
    const [, hideSplitPanel] = useAtom(hideSplitPanelAtom);
    const [notification, setNotification] = useAtom(notificationAtom);
    // amplify
    const client = generateClient();
    const sub = useCallback((id: string) => {
        // console.log("🚀 ~ Subscription set up -->:");
        const createSub = client
            .graphql({
                query: onPricingById,
                variables: {
                    id,
                },
            })
            .subscribe({
                next: ({ data }) => {
                    // console.log(`🚀 ~ ${id} ~ data:`, data.onPricingById);
                    setNotification({
                        ...notification,
                        isCompleteDemandAnalysis: data.onPricingById.demandForecast ? true : false,
                        isCompleteWebScarping: data.onPricingById.webScrap ? true : false,
                        isCompleteMarginAnalysis: data.onPricingById.marginAnalysis ? true : false,
                    });
                    refetch();
                },
                error: (err) => {
                    console.log(`🚀 ~ ${id} ~ data:`, err);
                },
            });
        return createSub;
    }, []);

    useEffect(() => {
        if (sessionID) {
            // hide the panel at page load
            hideSplitPanel();
            const updatePricingSubscription = sub(sessionID);
            return () => {
                if (updatePricingSubscription) {
                    // console.log("🚀 ~ <--Subscription clean up:");
                    updatePricingSubscription.unsubscribe();
                }
            };
        }
    }, [sessionID]); // ignore the deps otherwise this might have multiple subscriptions

    // Extract text from within square brackets
    const extractTextFromBrackets = (text: string) => {
        if (!text || typeof text !== "string") return text;

        // Find the first occurrence of text within square brackets
        const bracketRegex = /\[([^\]]+)\]/;
        const bracketMatch = text.match(bracketRegex);
        // If found, return the text inside brackets, otherwise return the original text
        return bracketMatch ? bracketMatch[0].trim() : text;
    };

    // Remove XML tags from text
    const removeXmlTags = (text: string) => {
        if (!text || typeof text !== "string") return text;

        // Replace all XML tags with empty string
        return text.replace(/<[^>]*>/g, "");
    };
    const messages = useMemo(() => {
        const chatMessages: Array<Messages> = [
            {
                rtl: true,
                sender: "human",
                message: "Determine the product price of the supplied product.",
            },
        ];
        if (data?.botResponses && data.botResponses?.length > 0) {
            JSON.parse(data.botResponses).map((b: BotMessage) => {
                chatMessages.push({
                    rtl: b.role === "user",
                    sender: b.content[0].text.includes("]")
                        ? extractTextFromBrackets(b.content[0].text)
                        : "super-agent",
                    message: removeXmlTags(b.content[0].text),
                });
            });
        }
        // find if final chain agent responded if not add the spinner message
        const chainMessageExists = chatMessages.find((i) =>
            i.message.includes("retail-product-pricing-orchestrator-chain")
        );
        if (!chainMessageExists) {
            chatMessages.push({
                rtl: false,
                sender: "super-agent",
                message: "loading",
            });
        }
        return chatMessages;
    }, [data]);

    return (
        <ColumnLayout columns={2}>
            <Container
                header={
                    <Header
                        variant="h1"
                        description={
                            "View real-time conversations between AI agents as they determine optimal pricing strategies."
                        }
                    >
                        Agent Chats
                    </Header>
                }
            >
                <div
                    className="overview"
                    style={{
                        width: "100%",
                        height: "80vh",
                        overflow: "auto",
                        scrollbarWidth: "thin",
                    }}
                >
                    <ChatMessages messages={messages} />
                </div>
            </Container>
            <Container
                header={
                    <Header
                        variant="h1"
                        description={
                            "Visualize the dynamic pricing workflow showing how multiple specialized agents collaborate and generate price recommendations."
                        }
                    >
                        Workflow
                    </Header>
                }
            >
                <MultiAgentFlow />
            </Container>
        </ColumnLayout>
    );
};
