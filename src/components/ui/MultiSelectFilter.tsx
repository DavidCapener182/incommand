'use client'

import React, { useMemo, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid'

interface MultiSelectFilterProps {
  label?: string
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
  dense?: boolean
}

export default function MultiSelectFilter({ label, options, selected, onChange, placeholder = 'Select...', className, dense = false }: MultiSelectFilterProps) {
  const [query, setQuery] = useState('')

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(o => o.toLowerCase().includes(q))
  }, [options, query])

  const toggleValue = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val))
    } else {
      onChange([...selected, val])
    }
  }

  const selectAll = () => onChange([...options])
  const clearAll = () => onChange([])

  return (
    <div className={`w-full ${className || ''}`}>
      {label && (
        <label className={`block ${dense ? 'text-[10px]' : 'text-xs'} font-medium text-gray-600 dark:text-gray-300 ${dense ? 'mb-0.5' : 'mb-1'}`}>{label}</label>
      )}
      <Listbox value={selected} onChange={onChange} multiple>
        <div className="relative">
          <Listbox.Button className={`relative w-full cursor-default ${dense ? 'rounded-lg py-1 pl-2 pr-8 text-xs shadow-sm border' : 'rounded-xl py-2 pl-3 pr-10 text-sm shadow-md border-2'} bg-white dark:bg-[#182447] text-left border-gray-200 dark:border-[#2d437a] focus:outline-none focus:ring-2 focus:ring-blue-500`}>
            <span className={`block truncate text-gray-900 dark:text-gray-100 ${dense ? 'text-xs' : ''}`}>
              {selected.length > 0 ? `${selected.length} selected` : (placeholder || 'Select...')}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className={`${dense ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400`} aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Transition
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto ${dense ? 'rounded-lg' : 'rounded-xl'} bg-white dark:bg-[#23408e] py-1 ${dense ? 'text-xs' : 'text-sm'} shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none border border-gray-200/50 dark:border-[#2d437a]/50`}>
              {/* Controls */}
              <div className={`px-2 ${dense ? 'py-1' : 'py-2'} border-b border-gray-100 dark:border-[#2d437a] sticky top-0 bg-white dark:bg-[#23408e]`}>
                <div className={`flex items-center gap-2 ${dense ? 'mb-1' : 'mb-2'}`}>
                  <button onClick={selectAll} className={`px-2 ${dense ? 'py-0.5 text-[10px]' : 'py-1 text-xs'} rounded bg-blue-100 text-blue-700 hover:bg-blue-200`}>Select All</button>
                  <button onClick={clearAll} className={`px-2 ${dense ? 'py-0.5 text-[10px]' : 'py-1 text-xs'} rounded bg-gray-100 text-gray-700 hover:bg-gray-200`}>Clear All</button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className={`${dense ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-gray-400`} />
                  </div>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..."
                    className={`w-full ${dense ? 'pl-7 pr-7 py-1 text-[11px] rounded-md' : 'pl-8 pr-8 py-1.5 rounded-lg'} border border-gray-200 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100`}
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400">
                      <XMarkIcon className={`${dense ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                    </button>
                  )}
                </div>
              </div>

              {filteredOptions.length === 0 && (
                <div className={`px-3 ${dense ? 'py-1 text-[11px]' : 'py-2 text-xs'} text-gray-500`}>No options</div>
              )}

              {filteredOptions.map((option) => (
                <Listbox.Option
                  key={option}
                  value={option}
                  className={({ active }) => `relative cursor-default select-none ${dense ? 'py-1.5 pl-7 pr-3 text-xs' : 'py-2 pl-8 pr-4'} ${active ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200' : 'text-gray-900 dark:text-gray-100'}`}
                >
                  {({ selected: isSelected }) => (
                    <>
                      <span className={`block truncate ${isSelected ? 'font-medium' : 'font-normal'}`}>{option}</span>
                      {isSelected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-blue-600">
                          <CheckIcon className={`${dense ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} aria-hidden="true" />
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); toggleValue(option); }}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${dense ? 'w-3.5 h-3.5' : 'w-4 h-4'} rounded border ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'} flex items-center justify-center`}
                        aria-pressed={isSelected}
                      >
                        {isSelected && <CheckIcon className={`${dense ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-white`} />}
                      </button>
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}


