import { ref, onMounted, onUnmounted } from 'vue';

export function useTypingAnimation(
  phrases: string[],
  typeSpeed = 50,
  deleteSpeed = 30,
  delay = 2000,
) {
  const currentPhrase = ref('');
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let timeoutId: number | undefined;

  const type = () => {
    const current = phrases[phraseIndex];
    if (isDeleting) {
      // Deleting
      currentPhrase.value = current.substring(0, charIndex - 1);
      charIndex--;
      if (charIndex > 0) {
        timeoutId = setTimeout(type, deleteSpeed);
      } else {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        timeoutId = setTimeout(type, 500); // Pause before typing next phrase
      }
    } else {
      // Typing
      currentPhrase.value = current.substring(0, charIndex + 1);
      charIndex++;
      if (charIndex < current.length) {
        timeoutId = setTimeout(type, typeSpeed);
      } else {
        isDeleting = true;
        timeoutId = setTimeout(type, delay); // Pause at the end of the phrase
      }
    }
  };

  onMounted(() => {
    if (phrases.length) {
      timeoutId = setTimeout(type, typeSpeed);
    }
  });

  onUnmounted(() => {
    clearTimeout(timeoutId);
  });

  return { currentPhrase };
}
