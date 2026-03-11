interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
}

export function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
    return (
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm select-none">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ease-in-out ${checked ? 'bg-pul-black' : 'bg-pul-border'
                    }`}
            >
                <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition duration-200 ease-in-out mt-0.5 ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'
                        }`}
                />
            </button>
            <span className={checked ? 'text-pul-black font-medium' : 'text-pul-gray'}>
                {label}
            </span>
        </label>
    );
}

export default ToggleSwitch;