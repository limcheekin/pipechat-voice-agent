'use client';

import { client } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

export default function Home() {
	const { data, isLoading, error } = useQuery({
		queryKey: ['health'],
		queryFn: async () => {
			const response = await client.GET('/health');
			return response.data;
		},
	});

	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="text-center">
				<h1 className="text-4xl font-bold mb-4">Better T-Stack + Python</h1>
				<p className="text-lg mb-8">TypeScript Frontend + Python Backend</p>

				<div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
					<h2 className="text-xl font-semibold mb-2">API Health Check</h2>
					{isLoading && <p>Loading...</p>}
					{error && <p className="text-red-500">Error: {error.message}</p>}
					{data && (
						<p className="text-green-600 dark:text-green-400">
							Status: {data.status} ✅
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
