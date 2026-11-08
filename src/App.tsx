import { useRef } from 'react';
import { FirstScreen } from './components/FirstScreen';
import { SecondScreen } from './components/SecondScreen';
import { SharedAvatar } from './components/SharedAvatar';
import { ThemeToggle } from './components/ThemeToggle';
import { useScrollProgress } from './hooks/useScrollProgress';

export default function App() {
  const firstScreenRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(firstScreenRef);
  const originRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <ThemeToggle />
      <SharedAvatar progress={progress} originRef={originRef} targetRef={targetRef} />
      <FirstScreen progress={progress} originRef={originRef} sectionRef={firstScreenRef} />
      <SecondScreen targetRef={targetRef} />
    </>
  );
}
