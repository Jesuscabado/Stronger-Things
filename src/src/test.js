import { connectMongo } from "./db/mongoose.js";
import { createObject,createObjectInstance } from "./controllers/objectController.js";
import {createCharacter,giveObjectToCharacter} from "./controllers/characterController.js"

async function main(){
    await connectMongo();
    const newObject = {
        name:"espada2",
        stats:{
            attack: 50
        }
    }
    const object = await createObject(newObject);
    const objectInstance= createObjectInstance(object._id,"espada magica",90);
    const character = await createCharacter({name:"usurio2"});
    const characterWithObject = await giveObjectToCharacter(character._id,objectInstance)
    console.log(characterWithObject);

}

main();