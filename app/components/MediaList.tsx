'use client'

import React from 'react'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { useMedia } from '../contexts/MediaContext'

const MediaList = () => {
  const { media, loading, error } = useMedia()
  const [sortColumn, setSortColumn] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')

  const handleSort = (column: string) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const renderSortIcon = (column: string) => {
    if (column === sortColumn) {
      return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
    }
    return null
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Advertising Media</h3>
        <button className="flex items-center text-gray-600 hover:text-gray-800">
          <Filter size={20} className="mr-1" />
          Filter
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('location')}>
                <div className="flex items-center">
                  Location
                  {renderSortIcon('location')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('type')}>
                <div className="flex items-center">
                  Type
                  {renderSortIcon('type')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                <div className="flex items-center">
                  Status
                  {renderSortIcon('status')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('startDate')}>
                <div className="flex items-center">
                  Start Date
                  {renderSortIcon('startDate')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('endDate')}>
                <div className="flex items-center">
                  End Date
                  {renderSortIcon('endDate')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('client')}>
                <div className="flex items-center">
                  Client
                  {renderSortIcon('client')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {media.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">{item.location}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.status === 'Available' ? 'bg-green-100 text-green-800' :
                    item.status === 'Reserved' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{item.startDate || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.endDate || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.client || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MediaList

