{items.map((item, index) => (
  <div key={index} className="border-b border-gray-200 py-4">
    <div className="flex justify-between">
      <div>
        <h3 className="font-medium">{item.mediaType}</h3>
        <p className="text-sm text-gray-600">{item.storeName}</p>
        <p className="text-sm text-gray-600">
          {format(new Date(item.startDate), 'd MMM yyyy')} - {format(new Date(item.endDate), 'd MMM yyyy')}
        </p>
        <p className="text-sm font-medium mt-1">
          Monto: ${item.extraInformation.planAlaMedidaAmount || item.amount}
        </p>
      </div>
      <button
        onClick={() => removeItem(item.spaceId)}
        className="text-red-500 hover:text-red-700"
      >
        Eliminar
      </button>
    </div>
  </div>
))} 