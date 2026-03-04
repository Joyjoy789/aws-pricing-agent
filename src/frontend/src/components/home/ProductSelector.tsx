import {
    Container,
    Header,
    SpaceBetween,
    Spinner,
    Tiles,
    Button,
} from "@cloudscape-design/components";
import { fetchJsonFromPath, useS3ListItems } from "../../hooks/useStorage";
import { ProductType, QUERY_KEYS } from "../../utilities/types";
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { addPricing, appsyncResolver } from "../../hooks/useApi";
import { useAuthenticator } from "@aws-amplify/ui-react";

import { useNavigate } from "react-router-dom";
import { AppRoutes } from "../../pages/PageNavigation";
import { useAtom } from "jotai";
import { notificationAtom } from "../../atoms/AppAtoms";
import { useResetAtom } from "jotai/utils";

export const ProductSelector = () => {
    const navigate = useNavigate();
    const { user } = useAuthenticator((context) => [context.user]);
    const { data: productItems, isLoading: isLoadingProducts } = useS3ListItems(
        QUERY_KEYS.PRODUCTS
    );
    const [products, setProducts] = useState<Array<ProductType>>([]);
    const [selectedProductID, setSelectedProductID] = useState("");
    const [notification, setNotification] = useAtom(notificationAtom);
    const resetNotifications = useResetAtom(notificationAtom);

    useEffect(() => {
        if (!productItems) return;
        // proceed only if `products.json` is found in S3
        const item = productItems.find((i) =>
            i.itemName.includes(QUERY_KEYS.PRODUCTS.toLowerCase())
        );
        if (!item) return;

        const response = fetchJsonFromPath(item.path + item.itemName);
        response.then((data) => {
            setProducts(data as unknown as [ProductType]);
        });
    }, [productItems]);

    const selectedProduct = useMemo(
        () => products.find((p: ProductType) => p.product_id === selectedProductID),
        [products, selectedProductID]
    );

    // trigger resolver function
    const resolverFunctionMutation = useMutation({
        mutationFn: (sessionID: string) =>
            appsyncResolver(
                JSON.stringify({
                    userID: user.userId,
                    sessionID,
                    product: selectedProduct,
                })
            ),
        onError: (error) => {
            console.error(error);
        },
        // onSuccess: (data) => {
        //     console.log("🚀 ~ Demo ~ data:", data);
        // },
    });

    // create a pricing transaction mutation
    const pricingTransactionMutation = useMutation({
        mutationFn: () => addPricing(user.userId, JSON.stringify(selectedProduct)),
        onError: (error) => {
            console.error(error);
        },
        onSuccess: ({ data }) => {
            console.log("🚀 ~ Demo ~ data:", data.createPricing);
            resolverFunctionMutation.mutate(data.createPricing.id);
            setNotification({
                ...notification,
                currentSessionId: data.createPricing.id,
            });
            navigate(AppRoutes.pricing.href.replace(":id", data.createPricing.id));
        },
        onMutate: () => {
            resetNotifications();
        },
    });

    return (
        <SpaceBetween direction="vertical" size="l">
            <Container
                header={
                    <Header
                        variant="h2"
                        description="Select a product and click generate to trigger the multi-agent orchestration."
                        actions={
                            <SpaceBetween direction="horizontal" size="xs">
                                <Button
                                    disabled={selectedProductID.length === 0 || !selectedProduct}
                                    variant="primary"
                                    loading={
                                        resolverFunctionMutation.isPending ||
                                        pricingTransactionMutation.isPending
                                    }
                                    onClick={() => pricingTransactionMutation.mutate()}
                                >
                                    Generate
                                </Button>
                            </SpaceBetween>
                        }
                    >
                        Product List
                    </Header>
                }
            >
                {isLoadingProducts && <Spinner />}
                {products.length > 0 && (
                    <Tiles
                        onChange={({ detail }) => setSelectedProductID(detail.value)}
                        value={selectedProductID}
                        columns={4}
                        items={products.map((c) => {
                            return {
                                label: c.product_id,
                                value: c.product_id,
                                description: c.vendor,
                                image: (
                                    <img
                                        width={"100%"}
                                        src={
                                            productItems?.find((i) =>
                                                i.itemName.includes(c.product_id)
                                            )?.url ??
                                            "https://img.freepik.com/premium-photo/circular-saw-icon-with-shiny-metallic_992212-269744.jpg"
                                        }
                                        alt={c.product_id}
                                        draggable={false}
                                    />
                                ),
                            };
                        })}
                    />
                )}
            </Container>
        </SpaceBetween>
    );
};
