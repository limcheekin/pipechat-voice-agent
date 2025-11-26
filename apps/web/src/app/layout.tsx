import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import Header from "@/components/header";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "PipeChat Voice Agent",
	description: "Real-time AI voice conversation application",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				{/* Load TalkingHead.js from CDN */}
				<script
					src="https://cdn.jsdelivr.net/gh/met4citizen/TalkingHead@1.4/modules/talkinghead.mjs"
					type="module"
					async
				/>
				<script
					type="importmap"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							imports: {
								"three": "https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js",
								"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.163.0/examples/jsm/"
							}
						})
					}}
				/>
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Providers>
					<div className="grid grid-rows-[auto_1fr] h-svh">
						<Header />
						{children}
					</div>
				</Providers>
			</body>
		</html>
	);
}

