import { useEffect, useRef, useState } from 'react';

const SWITCH_INTERVAL = 3000; // 名字切换周期 ms
const TYPE_SPEED = 80; // 打字速度 ms/字
const DELETE_SPEED = 40; // 删除速度 ms/字
const MIN_PAUSE = 1500; // 最短停留时间 ms
const GAP = 400; // 删除完成到下一个名字的空隙 ms

/**
 * 打字机效果：先完整显示第一个名字，停留后逐字删除，
 * 再循环「打字 → 停留 → 删除」，名字随机轮换且不与上一个重复。
 */
export function useTypewriter(names: string[]) {
  const [text, setText] = useState(() => names[0] ?? '');
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    if (names.length === 0) return;

    let timer: number | undefined;
    let cancelled = false;
    let currentNameIndex = 0;

    const setCurrent = (value: string) => {
      textRef.current = value;
      setText(value);
    };

    const sleep = (ms: number) =>
      new Promise<void>(resolve => {
        timer = window.setTimeout(resolve, ms);
      });

    const pickNext = () => {
      let next: number;
      do {
        next = Math.floor(Math.random() * names.length);
      } while (next === currentNameIndex && names.length > 1);
      currentNameIndex = next;
      return names[next];
    };

    (async () => {
      const first = names[0];
      setCurrent(first);
      await sleep(Math.max(SWITCH_INTERVAL - first.length * DELETE_SPEED, MIN_PAUSE));
      if (cancelled) return;

      for (;;) {
        while (textRef.current.length > 0 && !cancelled) {
          setCurrent(textRef.current.slice(0, -1));
          await sleep(DELETE_SPEED);
        }
        if (cancelled) break;
        await sleep(GAP);

        const name = pickNext();
        for (let i = 1; i <= name.length && !cancelled; i++) {
          setCurrent(name.slice(0, i));
          await sleep(TYPE_SPEED);
        }
        if (cancelled) break;

        const pause = Math.max(
          SWITCH_INTERVAL - name.length * TYPE_SPEED - name.length * DELETE_SPEED,
          MIN_PAUSE,
        );
        await sleep(pause);
      }
    })();

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [names]);

  return text;
}
