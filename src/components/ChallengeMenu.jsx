import { useEffect, useId, useRef, useState } from 'react'

// A dropdown for choosing a challenge. It replaces a native <select> because browsers
// decide where a native list opens (sometimes above the page); this one always opens
// directly below its button and scrolls inside itself if the list is long.
export default function ChallengeMenu({ challenges, selectedId, onSelect }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef(null)
  const listId = useId()
  const selectedIndex = Math.max(0, challenges.findIndex((c) => c.id === selectedId))
  const selected = challenges[selectedIndex]
  const optionId = (i) => `${listId}-${i}`

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (open) document.getElementById(optionId(active))?.scrollIntoView?.({ block: 'nearest' })
  })

  const openMenu = () => {
    setActive(selectedIndex)
    setOpen(true)
  }
  const choose = (i) => {
    onSelect(challenges[i].id)
    setOpen(false)
  }

  const onKeyDown = (e) => {
    const last = challenges.length - 1
    const move = (to) => {
      e.preventDefault()
      if (!open) openMenu()
      else setActive(Math.min(last, Math.max(0, to)))
    }
    switch (e.key) {
      case 'ArrowDown': return move(active + 1)
      case 'ArrowUp': return move(active - 1)
      case 'Home': return open ? move(0) : undefined
      case 'End': return open ? move(last) : undefined
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (open) choose(active)
        else openMenu()
        return undefined
      case 'Escape':
        if (open) {
          e.preventDefault()
          e.stopPropagation()
          setOpen(false)
        }
        return undefined
      case 'Tab':
        setOpen(false)
        return undefined
      default: return undefined
    }
  }

  return (
    <div ref={root} className="sm:relative">
      <button
        type="button"
        aria-label={`Select challenge: ${selectedIndex + 1}. ${selected.title}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? optionId(active) : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className="flex max-w-[60vw] items-center gap-2 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-100 hover:bg-slate-700"
      >
        <span className="text-slate-400">Challenge</span>
        <span className="truncate">{selectedIndex + 1}. {selected.title}</span>
        <span aria-hidden="true" className="text-slate-400">▾</span>
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Challenges"
          className="absolute left-4 right-4 top-full z-50 mt-1 max-h-[min(24rem,calc(100dvh-5rem))] overflow-y-auto rounded border border-slate-600 bg-slate-800 py-1 shadow-xl sm:left-0 sm:right-auto sm:w-80"
        >
          {challenges.map((c, i) => (
            <li
              key={c.id}
              id={optionId(i)}
              role="option"
              aria-selected={c.id === selectedId}
              data-value={c.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
              className={`cursor-pointer px-3 py-1.5 text-sm ${i === active ? 'bg-slate-700 text-white' : 'text-slate-200'} ${c.id === selectedId ? 'font-semibold text-emerald-300' : ''}`}
            >
              {i + 1}. {c.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
