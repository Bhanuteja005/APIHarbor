import { Body, Container, Head, Hr, Html, Link, Preview, Section, Tailwind, Text } from "@react-email/components";
import React, { ReactNode } from "react";

export interface BaseEmailWrapperProps {
  title: string;
  preview: string;
  siteUrl: string;
  children?: ReactNode;
}

export const BaseEmailWrapper = ({ title, preview, children, siteUrl }: BaseEmailWrapperProps) => {
  return (
    <Html>
      <Head title={title} />
      <Tailwind>
        <Body className="bg-gray-300 my-auto mx-auto font-sans px-[8px] py-[4px]">
          <Preview>{preview}</Preview>
          <Container className="bg-white rounded-xl my-[40px] mx-auto pb-[0px] max-w-[500px]">
            <Section className="mb-[24px] px-[24px] mt-[24px] text-center">
              <Text className="m-0 text-center text-[22px] font-bold text-gray-900 tracking-tight">
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: "#0a0a0a",
                    color: "#fafafa",
                    borderRadius: "8px",
                    width: "32px",
                    height: "32px",
                    lineHeight: "32px",
                    fontSize: "20px",
                    textAlign: "center",
                    verticalAlign: "middle",
                    marginRight: "8px"
                  }}
                >
                  ∞
                </span>
                APIHarbor
              </Text>
            </Section>
            <Hr className=" mb-[32px] mt-[0px] h-[1px]" />
            <Section className="px-[28px]">{children}</Section>
            <Hr className=" mt-[32px] mb-[0px] h-[1px]" />
            <Section className="px-[24px] text-center">
              <Text className="text-gray-500 text-[12px]">
                Email sent via{" "}
                <Link href={siteUrl} className="text-slate-700 underline decoration-slate-700">
                  APIHarbor
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
