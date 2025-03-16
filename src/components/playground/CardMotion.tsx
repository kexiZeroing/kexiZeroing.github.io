import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'

const CARDS = [
  {
    id: '1',
    title: 'Spring',
    color: '#4CAF50',
    description: 'A season of renewal, where flowers bloom, trees regain their leaves, and the world feels fresh and full of life.'
  },
  {
    id: '2',
    title: 'Summer',
    color: '#FF5722',
    description: 'The sunniest and warmest season, filled with long days, outdoor adventures, and a carefree energy.'
  },
  {
    id: '3',
    title: 'Fall',
    color: '#795548',
    description: 'A crisp and colorful transition, where leaves turn vibrant shades, the air cools, and nature prepares for rest.'
  },
  {
    id: '4',
    title: 'Winter',
    color: '#3F51B5',
    description: 'A cold and quiet time, with snow-covered landscapes, cozy moments, and a sense of stillness.'
  }
]

export function MotionCards() {
  const [selectedCard, setSelectedCard] = useState(null)

  return (
    <>      
      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {CARDS.map((card) => (
          <motion.div 
            key={card.id}
            layoutId={`card-${card.id}`}
            className="rounded-lg p-6 text-white cursor-pointer"
            style={{ backgroundColor: card.color }}
            onClick={() => setSelectedCard(card)}
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.2)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.h3 
              layoutId={`title-${card.id}`} 
              className="text-xl font-bold mb-2"
            >
              {card.title}
            </motion.h3>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedCard && (
          <>
            {/* Backdrop */}
            <motion.div 
              className="fixed inset-0 bg-black z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCard(null)}
            />
            
            {/* Modal */}
            <motion.div 
              layoutId={`card-${selectedCard.id}`}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-lg p-6"
              style={{ backgroundColor: selectedCard.color }}
            >
              <motion.h3 
                layoutId={`title-${selectedCard.id}`}
                className="text-2xl font-bold mb-4 text-white"
              >
                {selectedCard.title}
              </motion.h3>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-white/90"
              >
                {selectedCard.description}
              </motion.p>
              
              <motion.button
                className="mt-4 bg-white text-black px-4 py-2 rounded hover:bg-gray-100"
                onClick={() => setSelectedCard(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Close
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}