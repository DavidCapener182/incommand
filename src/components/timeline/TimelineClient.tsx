'use client'

import { useState, useCallback, memo } from 'react'
import dynamic from 'next/dynamic'

const MotionDiv = dynamic(() => import('framer-motion').then(m => m.motion.div))
const DragDropContext = dynamic(() => import('react-beautiful-dnd').then(m => m.DragDropContext))
const Droppable = dynamic(() => import('react-beautiful-dnd').then(m => m.Droppable))
const Draggable = dynamic(() => import('react-beautiful-dnd').then(m => m.Draggable))

interface Props {
  incidents: { id: string; title: string; status: string; timestamp: string }[]
}

function Timeline({ incidents }: Props) {
  const [items, setItems] = useState(incidents)

  const onDragEnd = useCallback((result: any) => {
    if (!result.destination) return
    const updated = Array.from(items)
    const [moved] = updated.splice(result.source.index, 1)
    updated.splice(result.destination.index, 0, moved)
    setItems(updated)
  }, [items])

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="timeline">
        {provided => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
            {items.map((incident, index) => (
              <Draggable key={incident.id} draggableId={incident.id} index={index}>
                {provided => (
                  <MotionDiv
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-grab"
                  >
                    <p className="font-semibold text-blue-900">{incident.title}</p>
                    <p className="text-xs text-blue-700">{incident.timestamp}</p>
                  </MotionDiv>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default memo(Timeline)
