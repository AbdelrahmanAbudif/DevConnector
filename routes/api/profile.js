const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const {check , validationResult} = require('express-validator');


router.get('/me' ,auth, async (req , res) => {
   try{
     const profile = await Profile.findOne({user: req.user.id}).populate(
        'user',
        ['name','avatar']
     );
     if(!profile){
       return res.status(400).json({msg: 'No profile for this user'});
     }
     return res.json(profile);
   }catch(err){
    console.error(err.message);
    res.status(500).json({msg:'Could not get profile. Server Error...'})
   }
});

//@route post profile request api/profile
//@desc create  a profile for a user
//@access  Private will need auth token to request
router.post(
    '/',
    auth,
    check('status', 'Status is required').notEmpty(),
    check('skills', 'Skills is required').notEmpty(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      // destructure the request
      const {
        website,
        skills,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook,
        // spread the rest of the fields we don't need to check
        ...rest
      } = req.body;
  
      // build a profile
      const profileFields = {
        user: req.user.id,
        website:
          website && website !== '',
        skills: Array.isArray(skills)
          ? skills
          : skills.split(',').map((skill) => ' ' + skill.trim()),
        ...rest
      };
  
      // Build socialFields object
      const socialFields = { youtube, twitter, instagram, linkedin, facebook };
      profileFields.social = socialFields;
  
      try {
        // Using upsert option (creates new doc if no match is found):
        let profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        return res.json(profile);
      } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
      }
    }
  );
//@route get profile request api/profile
//@desc get all user profiles
//@access  public will not need auth token to request
router.get('/' , async (req , res)=>{
    try{
        const profiles = await Profile.find().populate('user',['name','avatar']);
        return res.status(200).json(profiles);
    } catch(error){
        console.log(error);
        return res.status(500).json({error:error.array()});
    }
});
//@route get profile request api/profile  by id
//@desc get user profile by user id
//@access  private will not need auth token to request
router.get('/user/:user_id' , async (req , res)=>{
    try{
        const profile = await Profile.findOne({user: req.params.user_id}).populate('user',['name','avatar']);
        if(!profile) return res.status(400).json({msg: 'No profile created for this user.'});
        return res.status(200).json(profile);
    } catch(error){
        console.log(error);
        return res.status(500).json({error:error.array()});
    }
});
//@route delete profile request api/profile  by id
//@desc delete user profile by user id
//@access  private will not need auth token to request
router.delete('/',auth, async (req , res)=>{
    try{
      const profile = await Profile.findOneAndDelete({user:req.user.id});
      const user = await User.findOneAndDelete({_id: req.user.id});
      return res.status(200).json(user);
    } catch(error){
        console.log(error);
        return res.status(500).json({error:error.array()});
    }
});
module.exports = router;