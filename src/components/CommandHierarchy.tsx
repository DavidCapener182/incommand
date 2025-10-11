'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  MinusCircleIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

interface CommandMember {
  id: string
  name: string
  callsign: string
  role: string
  level: 'gold' | 'silver' | 'bronze' | 'operator'
  status: 'online' | 'away' | 'offline'
  avatar?: string
  subordinates?: CommandMember[]
  currentIncidents?: number
  lastActive?: string
}

interface CommandHierarchyProps {
  eventId: string
  className?: string
}

const LEVEL_CONFIG = {
  gold: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-500',
    label: 'Gold Commander'
  },
  silver: {
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-200 dark:bg-gray-700',
    borderColor: 'border-gray-400',
    label: 'Silver Commander'
  },
  bronze: {
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-500',
    label: 'Bronze Commander'
  },
  operator: {
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-500',
    label: 'Operator'
  }
}

const STATUS_CONFIG = {
  online: { icon: CheckCircleIcon, color: 'text-green-500', label: 'Online' },
  away: { icon: ClockIcon, color: 'text-yellow-500', label: 'Away' },
  offline: { icon: MinusCircleIcon, color: 'text-gray-400', label: 'Offline' }
}

export default function CommandHierarchy({
  eventId,
  className = ''
}: CommandHierarchyProps) {
  const [hierarchy, setHierarchy] = useState<CommandMember | null>(null)
  const [selectedMember, setSelectedMember] = useState<CommandMember | null>(null)

  useEffect(() => {
    loadHierarchy()
  }, [eventId])

  const loadHierarchy = () => {
    // Mock hierarchy - in production, fetch from API
    const mockHierarchy: CommandMember = {
      id: '1',
      name: 'John Smith',
      callsign: 'Gold 1',
      role: 'Event Commander',
      level: 'gold',
      status: 'online',
      currentIncidents: 0,
      subordinates: [
        {
          id: '2',
          name: 'Sarah Johnson',
          callsign: 'Silver 1',
          role: 'Tactical Commander',
          level: 'silver',
          status: 'online',
          currentIncidents: 3,
          subordinates: [
            {
              id: '3',
              name: 'Mike Williams',
              callsign: 'Bronze 1',
              role: 'Sector North',
              level: 'bronze',
              status: 'online',
              currentIncidents: 2,
              subordinates: [
                {
                  id: '4',
                  name: 'Team Alpha',
                  callsign: 'Alpha 1',
                  role: 'Entry Team',
                  level: 'operator',
                  status: 'online',
                  currentIncidents: 1
                },
                {
                  id: '5',
                  name: 'Team Bravo',
                  callsign: 'Bravo 1',
                  role: 'Crowd Team',
                  level: 'operator',
                  status: 'away',
                  currentIncidents: 0
                }
              ]
            },
            {
              id: '6',
              name: 'Emily Davis',
              callsign: 'Bronze 2',
              role: 'Sector South',
              level: 'bronze',
              status: 'online',
              currentIncidents: 1,
              subordinates: [
                {
                  id: '7',
                  name: 'Team Charlie',
                  callsign: 'Charlie 1',
                  role: 'Response Team',
                  level: 'operator',
                  status: 'online',
                  currentIncidents: 1
                }
              ]
            }
          ]
        }
      ]
    }

    setHierarchy(mockHierarchy)
  }

  const renderMember = (member: CommandMember, depth: number = 0) => {
    const levelConfig = LEVEL_CONFIG[member.level]
    const statusConfig = STATUS_CONFIG[member.status]
    const StatusIcon = statusConfig.icon

    return (
      <div key={member.id} className="relative">
        {/* Connecting Line */}
        {depth > 0 && (
          <div className="absolute left-0 top-0 w-8 h-1/2 border-l-2 border-b-2 border-gray-300 dark:border-gray-600 -ml-8" />
        )}

        {/* Member Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: depth * 0.1 }}
          className={`mb-4 ${depth > 0 ? 'ml-16' : ''}`}
        >
          <div
            className={`bg-white dark:bg-gray-800 border-2 ${levelConfig.borderColor} rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer ${
              selectedMember?.id === member.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedMember(member)}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className={`relative flex-shrink-0 w-12 h-12 ${levelConfig.bgColor} rounded-full flex items-center justify-center`}>
                {member.avatar ? (
                  <Image src={member.avatar} alt={member.name} width={48} height={48} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserCircleIcon className={`h-8 w-8 ${levelConfig.color}`} />
                )}
                {/* Status Indicator */}
                <div className="absolute -bottom-1 -right-1">
                  <StatusIcon className={`h-4 w-4 ${statusConfig.color} bg-white dark:bg-gray-800 rounded-full`} />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {member.callsign}
                  </span>
                  <span className={`px-2 py-0.5 ${levelConfig.bgColor} ${levelConfig.color} text-xs font-medium rounded-full`}>
                    {levelConfig.label}
                  </span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  {member.name} • {member.role}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />
                    {statusConfig.label}
                  </span>
                  {member.currentIncidents !== undefined && member.currentIncidents > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-full font-medium">
                      {member.currentIncidents} active
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Subordinates */}
          {member.subordinates && member.subordinates.length > 0 && (
            <div className="mt-2">
              {member.subordinates.map(subordinate => renderMember(subordinate, depth + 1))}
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Command Hierarchy
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time view of command structure and availability
        </p>
      </div>

      {/* Hierarchy Tree */}
      {hierarchy ? (
        <div className="relative">
          {renderMember(hierarchy)}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading hierarchy...
        </div>
      )}

      {/* Member Details Panel */}
      {selectedMember && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                {selectedMember.callsign}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedMember.name} • {selectedMember.role}
              </p>
            </div>
            <button
              onClick={() => setSelectedMember(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Status</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {selectedMember.status}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active Incidents</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedMember.currentIncidents || 0}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              Send Message
            </button>
            <button className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors">
              Call
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
