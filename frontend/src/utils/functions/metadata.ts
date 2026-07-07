import { Metadata } from "next";

export const generateMetadata = ({
    title = `${process.env.NEXT_PUBLIC_APP_NAME} - The API Key Health Platform for Businesses`,
    description = `${process.env.NEXT_PUBLIC_APP_NAME} is the API key health platform for businesses. It helps you track, monitor, and secure your API keys.`,
    image = "/thumbnail.png",
    // ?v=2 busts browser caches that still hold the pre-rebrand favicon; the
    // primary icon is src/app/icon.svg (served content-hashed by Next).
    icons = [
        {
            rel: "apple-touch-icon",
            sizes: "32x32",
            url: "/apple-touch-icon.png?v=2"
        },
        {
            rel: "icon",
            sizes: "32x32",
            url: "/favicon-32x32.png?v=2"
        },
        {
            rel: "icon",
            sizes: "16x16",
            url: "/favicon-16x16.png?v=2"
        },
    ],
    noIndex = false
}: {
    title?: string;
    description?: string;
    image?: string | null;
    icons?: Metadata["icons"];
    noIndex?: boolean;
} = {}): Metadata => ({
    title,
    description,
    icons,
    openGraph: {
        title,
        description,
        ...(image && { images: [{ url: image }] }),
    },
    twitter: {
        title,
        description,
        ...(image && { card: "summary_large_image", images: [image] }),
        creator: "@apiharbor",
    },
    metadataBase: new URL(`https://${process.env.NEXT_PUBLIC_APP_DOMAIN || "apiharbor.io"}`),
    ...(noIndex && { robots: { index: false, follow: false } }),
});
