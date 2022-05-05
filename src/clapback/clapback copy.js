/**
 * @typedef Clapback - Object generated from ClapbackFactory
 * @property {string} name - Indicates whether the Courage component is present.
 * @property {number} age - Indicates whether the Courage component is present.
 * @property {() => string} getName - getter Name
 * @property {(nome:string) => void} setName - (method) setter Name
 * @typedef {function(string,number): Clapback} ClapbackFactory
 */

/**
 * @type {ClapbackFactory}
 * @param {string} name - name of thing
 * @param {number} age
 */
export function createClapback(name, age) {
    let _name = name
    return {
        name,
        age,
        getName() {
            return _name
        },
        setName(name) {
            _name = name
        }
    }
}