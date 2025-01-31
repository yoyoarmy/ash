'use client';

import { MediaDashboard } from '../../../components/MediaDashboard';

export default function StorePage({ params }: { params: { id: string } }) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Store {params.id}</h2>
      </div>
      <MediaDashboard storeId={params.id} />
    </div>
  );
}