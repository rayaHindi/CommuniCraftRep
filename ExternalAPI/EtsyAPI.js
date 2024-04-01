const express = require('express');
const axios = require('axios');

const router = express();
////unfortunetly,we waited over two weeks to have our request for 
///the api key to be aproved,but we didn't recieve any response from them
const API_KEY = 'API_KEY'; 
router.use(express.json());

router.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        const response = await axios.get('https://openapi.etsy.com/v2/listings/active', {
            params: {
                api_key: API_KEY,
                keywords: query
            }
        });

        const items = response.data.results;
        res.json(items);
    } catch (error) {
        console.error('Error searching for craft supplies:', error);
        res.status(500).json({ error: 'An error occurred while searching for craft supplies' });
    }
});

module.exports=router;
