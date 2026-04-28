import CharacterModel from "../../models/CharacterModel.js";

export const getAllCharacters = async (req, res) => {
    const characters = await CharacterModel.find().populate('user', 'username');
    res.json(characters);
};

export const getCharacterById = async (req, res) => {
    const character = await CharacterModel.findById(req.params.id);
    res.json(character);
};

export const createCharacter = async (req, res) => {
    const newCharacter = new CharacterModel(req.body);
    await newCharacter.save();
    res.status(201).json(newCharacter);
};

export const updateGold = async (req, res) => {
    const updated = await CharacterModel.findByIdAndUpdate(
        req.params.id, 
        { gold: req.body.gold }, 
        { new: true }
    );
    res.json(updated);
};

export const deleteCharacter = async (req, res) => {
    await CharacterModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Eliminado" });
};