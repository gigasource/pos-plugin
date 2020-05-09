module.exports = function normalizeString(string) {
  const arr1 = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'];
  const arr2 = ['a', 'o', 'u', 'ss', 'A', 'O', 'U'];
  for (let i = 0; i < arr1.length; i++) {
    string = string.replace(new RegExp(arr1[i], 'g'), arr2[i]);
  }
  return string;
}
