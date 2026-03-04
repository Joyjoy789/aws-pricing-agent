import {
    Cards,
    Box,
    SpaceBetween,
    Header,
    ButtonDropdown,
    Container,
    ButtonDropdownProps,
    TextContent,
} from "@cloudscape-design/components";
import { useEffect, useMemo, useState } from "react";
import bedrockBrain from "../../assets/bedrock_brain.png";
import { QUERY_KEYS, StoreProduct } from "../../utilities/types";
import { fetchJsonFromPath, useS3ListItems } from "../../hooks/useStorage";

interface props {
    storeName: QUERY_KEYS.BUILDER_DEPOT | QUERY_KEYS.TOOL_MASTER;
}
export const StoreItems = (props: props) => {
    const { data: productItems, isLoading: isLoadingProducts } = useS3ListItems(props.storeName);
    const [products, setProducts] = useState<Array<StoreProduct>>([]);
    const [selectedProductType, setSelectedProductType] = useState("");

    const buttonGroupItems = useMemo(() => {
        const items = products.map((i) => ({
            id: i.product_type,
            text: i.product_type,
        }));
        const uniqueItems = items.filter(
            (item, index, self) => index === self.findIndex((t) => t.id === item.id)
        );
        uniqueItems.unshift({
            id: "All",
            text: "All",
        });
        return uniqueItems as ButtonDropdownProps.ItemOrGroup[];
    }, [products]);

    const filteredProducts = useMemo(() => {
        if (selectedProductType === "" || selectedProductType === "All") return products;
        return products.filter((product) => product.product_type === selectedProductType);
    }, [selectedProductType, products]);

    useEffect(() => {
        setSelectedProductType("");
        if (!productItems) return;
        const response = fetchJsonFromPath(productItems[0].path + productItems[0].itemName);
        response.then((data) => {
            setProducts(data as unknown as [StoreProduct]);
        });
    }, [productItems]);

    return (
        <Container
            header={
                <Header
                    counter={`(${filteredProducts.length})`}
                    actions={
                        <SpaceBetween direction="horizontal" size="xs">
                            <ButtonDropdown
                                variant="primary"
                                onItemClick={({ detail }) => setSelectedProductType(detail.id)}
                                items={buttonGroupItems}
                            >
                                Product Types
                            </ButtonDropdown>
                        </SpaceBetween>
                    }
                >
                    Product List
                </Header>
            }
        >
            <Cards
                cardDefinition={{
                    header: (item) => (
                        <TextContent>
                            <h4>{item.model}</h4>
                            <p>
                                <small>{props.storeName.replace("_", " ")}</small>
                            </p>
                        </TextContent>
                    ),
                    sections: [
                        {
                            id: "image",
                            content: () => (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        height: "100%",
                                    }}
                                >
                                    <img
                                        style={{
                                            borderRadius: "1vw",
                                            border: "1px solid #f4ae01",
                                            boxShadow: "0 0 10px rgba(27, 54, 208, 0.73)",
                                            objectFit: "cover",
                                            width: "70%",
                                            objectPosition: "center",
                                            overflow: "hidden",
                                            margin: "1vw",
                                        }}
                                        src={bedrockBrain}
                                        alt="product type"
                                    />
                                </div>
                            ),
                        },
                        {
                            id: "regularPrice",
                            header: "Price",
                            content: (item) => `$ ${item.regular_price}`,
                        },
                        {
                            id: "product_type",
                            header: "Product Type",
                            content: (item) => item.product_type,
                        },
                        {
                            id: "stock_status",
                            header: "Stock Status",
                            content: (item) => item.stock_status,
                        },
                    ],
                }}
                cardsPerRow={[{ cards: 2 }, { minWidth: 200, cards: 5 }]}
                items={filteredProducts}
                loading={isLoadingProducts}
                loadingText="Loading resources"
                selectionType="single"
                trackBy="model"
                visibleSections={["image", "regularPrice", "product_type", "stock_status"]}
                empty={
                    <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
                        <SpaceBetween size="m">
                            <b>No resources</b>
                        </SpaceBetween>
                    </Box>
                }
            />
        </Container>
    );
};
