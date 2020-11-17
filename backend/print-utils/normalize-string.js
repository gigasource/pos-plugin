module.exports = function normalizeString(str) {
  const arr1 = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'];
  const arr2 = ['a', 'o', 'u', 'ss', 'A', 'O', 'U'];

  for (let i = 0; i < arr1.length; i++) {
    str = str.replace(new RegExp(arr1[i], 'g'), arr2[i]);
  }

  str = removeUnsupportedCharacters(str);

  return str;
}

function removeUnsupportedCharacters(str) {
  if (!str) return str;

  let res = '';

  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 127) res += '_';
    else res += str[i];
  }

  return res;
}
