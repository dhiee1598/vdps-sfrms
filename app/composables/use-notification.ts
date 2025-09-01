export default function () {
  const isMessage = ref(false);
  const isError = ref(false);
  const responseMessage = ref('');

  function showMessage(message: string, isErrorType: boolean) {
    responseMessage.value = message;
    isError.value = isErrorType;
    isMessage.value = true;

    setTimeout(() => {
      isMessage.value = false;
      responseMessage.value = '';
    }, 3000);
  }

  return {
    isMessage,
    isError,
    responseMessage,
    showMessage,
  };
}
