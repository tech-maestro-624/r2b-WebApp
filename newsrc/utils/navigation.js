// Universal navigation utility for Back button
export function handleBack(navigate) {
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    navigate('/');
  }
} 