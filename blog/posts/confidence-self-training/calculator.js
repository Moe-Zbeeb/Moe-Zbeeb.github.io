const probability = document.getElementById('token-probability');
const length = document.getElementById('response-length');
const format = value => value === 0 ? '0' : value.toExponential(4);
function updateConfidence() {
  const p = Number(probability.value);
  const tokens = Number(length.value);
  const sum = tokens * Math.log(p);
  const sequence64 = Math.exp(sum);
  const score32 = Math.fround(sum);
  const confidence32 = Math.fround(Math.exp(score32));
  const base32 = Math.fround(0.1);
  const weight32 = Math.fround(confidence32 + base32);
  document.getElementById('probability-value').textContent = p.toFixed(2);
  document.getElementById('length-value').textContent = String(tokens);
  document.getElementById('log-score').textContent = sum.toFixed(3);
  document.getElementById('sequence-score').textContent = format(sequence64);
  document.getElementById('fp32-confidence').textContent = format(confidence32);
  document.getElementById('fp32-weight').textContent = weight32.toPrecision(10);
  document.getElementById('weight-change').textContent = format(weight32 - base32);
  const status = document.getElementById('confidence-status');
  status.textContent = confidence32 === 0
    ? 'The confidence itself rounds to zero in FP32. The weight equals the uniform control.'
    : weight32 === base32
      ? 'Confidence is nonzero, but adding it does not change the FP32 weight.'
      : 'Confidence changes the FP32 weight. A numerical contrast exists in this example.';
}
probability.addEventListener('input', updateConfidence);
length.addEventListener('input', updateConfidence);
updateConfidence();
