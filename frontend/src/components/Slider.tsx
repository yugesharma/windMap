import React, { useMemo } from 'react';

type SliderProps = {
  selectedDate: string;
  availableDates: string[];
  onDateChange: (dateIso: string) => void;
};

const Slider: React.FC<SliderProps> = ({ selectedDate, availableDates, onDateChange }) => {
    const sanitizedDates = useMemo(() => {
        return Array.from(new Set(availableDates)).sort();
    }, [availableDates]);

    if (sanitizedDates.length === 0) {
        return null;
    }

    const selectedIndex = Math.max(0, sanitizedDates.indexOf(selectedDate));

    const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextIndex = Number(event.target.value);
        const nextDate = sanitizedDates[nextIndex];
        if (nextDate) {
        onDateChange(nextDate);
        }
    };

    return (
        <div
        style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '320px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '10px 12px',
            borderRadius: '8px',
            zIndex: 100
        }}
        >
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '12px' }}>
            Forecast Time: {new Date(sanitizedDates[selectedIndex]).toLocaleString()}
        </label>

        <input
            type="range"
            min={0}
            max={sanitizedDates.length - 1}
            step={1}
            value={selectedIndex}
            onChange={handleSliderChange}
            style={{ width: '100%', height: '20px' }}
        />
        </div>
    );
};

export default Slider;