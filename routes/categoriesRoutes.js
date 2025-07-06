const express = require('express');
const router = express.Router();
const { categories } = require('../dbHandler');

router.get('/list', async (req, res) =>{
    try{
        const categoryList = await categories.findAll({
            attributes: ['id', 'categoryName']
        })
        res.json(categoryList)
    } catch(error){
        res.status(500).json({message: 'Hiba a kategóriák lekérésekor'})
    }
})


module.exports = router;