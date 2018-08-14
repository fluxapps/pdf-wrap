/**
 * Returns the elements of the given {@code list} pairwise in a new array.
 *
 * If the given array has an uneven number of elements, the last element will be ignored.
 *
 * @param {Array<T>} list - the array to get pairwise
 *
 * @returns {Array<[T, T]>} an array of tuples
 */
export function pairwise<T>(list: Array<T>): Array<[T, T]> {

    if (list.length % 2 === 1) {
        list.pop();
    }

    const pairs: Array<[T, T]> = [];

    for (let x: number = 0; x < list.length; x += 2) {

        const pair: Array<T> = list.slice(x, x + 2);

        pairs.push([pair[0], pair[1]]);
    }

    return pairs;
}
