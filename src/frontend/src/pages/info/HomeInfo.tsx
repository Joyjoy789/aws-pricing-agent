import { HelpPanel, Icon, TextContent } from "@cloudscape-design/components";

export const HomeInfo = () => {
    return (
        <HelpPanel
            footer={
                <TextContent>
                    <h3>
                        Learn more <Icon name="external" size="inherit" />
                    </h3>
                    <ul>
                        <li>
                            <a href="https://aws.amazon.com/personalize/" target="_blank">
                                Amazon Personalize
                            </a>
                        </li>
                        <li>
                            <a href="https://aws.amazon.com/bedrock/" target="_blank">
                                Amazon Bedrock
                            </a>
                        </li>
                    </ul>
                </TextContent>
            }
            header={<h2>Marketing Personalizations</h2>}
        >
            <TextContent>
                <h3>Data-driven customization</h3>
                <p>
                    A hyper personalized marketing email generator utilizes vast amounts of customer
                    data, including demographics, purchase history, browsing behavior, and
                    engagement metrics to create highly tailored email content for each individual
                    recipient.
                </p>
                <br />
                <h3>Dynamic adaptation</h3>
                <p>
                    Generative AI enables the creation of email content that can adapt in real-time
                    based on the latest customer interactions, market trends, or even current
                    events, ensuring that each email is not only personalized but also timely and
                    contextually relevant.
                </p>
                <br />
                <h3>Scalability and efficiency:</h3>
                <p>
                    Despite the high level of personalization, these generators can produce large
                    volumes of individualized emails efficiently, enabling marketers to reach entire
                    customer bases with hyper-personalized content without sacrificing speed or
                    quality.
                </p>
            </TextContent>
        </HelpPanel>
    );
};
