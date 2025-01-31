import Link from 'next/link'
import React from 'react'
import { Home, Calendar, FileText, Bell, Users, Settings } from 'lucide-react'

const Sidebar = () => {
  return (
    <div className="bg-gray-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out">
      <nav>
        <Link href="/" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
          <Home className="inline-block mr-2" size={20} />
          Dashboard
        </Link>
        <Link href="/calendar" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
          <Calendar className="inline-block mr-2" size={20} />
          Calendar
        </Link>
        <Link href="/reports" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
          <FileText className="inline-block mr-2" size={20} />
          Reports
        </Link>
        <Link href="/alerts" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
          <Bell className="inline-block mr-2" size={20} />
          Alerts
        </Link>
        <Link href="/users" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
          <Users className="inline-block mr-2" size={20} />
          Users
        </Link>
        <Link href="/manage" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
          <Settings className="inline-block mr-2" size={20} />
          Manage
        </Link>
      </nav>
    </div>
  )
}

export default Sidebar

