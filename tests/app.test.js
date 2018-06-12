require('./../bin/www');
const expect = require('expect');
const request = require('supertest');

const app = require('./../app');
const {BioserverId} = require('./../models/bioserverId');
const {UserFP} = require('./../models/userFP');

const bioserverIP_1 = 'https://192.168.1.44:8449'; // clean
const bioserverIP_2 = 'https://192.168.1.44:8450'; // clean
const bioserverIP_3 = 'https://192.168.1.44:8452'; // not exist
const clientUserId_1 = 'user1@gmail.com';
const clientUserId_2 = 'user2@gmail.com';
const clientUserId_3 = 'user3@gmail.com';
const fpIndex_1 = 2;
const fpIndex_2 = 8;
const fpIndex_3 = 10;
const encMinutiae_1 = '1e9486a5d4565eb3407272bc211089307312428c3640fd558effe43f10c557a384eb8d560b18208a52460a9d438a254933fbbe43d78520538f4aa6a801c2528844d7a095fb61190a101c61014b0d1ab707849212ab084a5880a46ab83cd30141c275a245ec4652885a3d10413d238dcf082c0928daae2467fa9409475f8137d7c29cace1826b42e262376dae342fdf32b1fc80a2c0178598731882b7340d8f8f62627605d9cf8a1f1d56de78333216c35062ab4675333c9eaf251a463c576f3e8561d1e3d65f4058b823a92b13dc1864a777fbff70661bc98af88c5e45ac8018268ed61495576886f3aa0a81f9dbf4e6021e80ca0440f1f46fc35abfe8f0e4aa30ad21929f498dd0ab62fe63688c60c16601297910ebd95ed76c23a8761f12a7752dac06e254a2d129276c9308b3fc8bbd8f9c0de4a4ea9bb502033aa20f849035f810b9004f36b844292291ea3a1a45e3fdb9476a234dbba73052ee88e76d42ee3c72d88d53c75e1f886f0be7823a0395bcb7d240f1c4760675431364c4c2dc335f801c50f48fd930cd7258be0cacf72bb2f88ae7c7a9a2f52e0eea1780e5d7c1ea0ed834ec5f6b35830631c48155f134f045b853f09c1c2a37fc77c36232a09383777543e2107bc94311de3aa57158743627d24fea8623ed85c916ae19fe25f4f2ebe8599a51f681694a3587ea7d184618e0e7175ce323cf5c390992089dcf';
const encMinutiae_2 = '73cb53c65e2e8902b65e387a394d9d0016a93355cdbeb0ddd3139c316808cc781e7eca83d7f4153c776262a522cfc69913f4eaaa157cb4021737c87aa730fbfae4b390b0dcaaace54574c0899e793ebde8e48c5e754f33333ac61d57082ebc602fe9dd40b2f1c792f5f13a990267fc07786c5e87abbba4fa22c377658aa7c0ef03a3d4f2db6f3db29e7f2d9619219d15248d9996cdf5e9e11be2d05f948b68085ad1130e1fb828fef9aad5dcea3942540136220df3684ec4b2fa1c27500e74c08294d31522ec40935691f5b2f78e757bea21a7b7f2ba84dbb3a54681e4502f83335d7690693f8e735e179a7870aa1f2a71d377856315057a479e6f1d947480c15e6ed7bad711bf90f90bf15cfb79950a3650e26cae1a470ffc1232acc971a77b847bb78c923e5143501a4c1fc49bd4123615b1211030fdd5ea9cc47c3825e06802b59664ea08a531f5456d3819ff0327d0c30889bef6ccdc4ce8632dbaffbd7c50bdf413494c38223e38ad566eab364d3362fbddf5c5dcb6eb0f247f7b8eed5927d696e1f487c8fcfdf5ad82d08e6182349dd9512d4f0ad99d2b0283fbcab27b9799d28636dba5bcc0eb26e412dc1d190d2da91f47c4d3caf1b9033e934d372604d472f8c531d53120b48f3098fbd196068ef77647a76f3dfec1d50a52cf9a5b9272f600771065333ff32350d65970ea28e17405fc14606d47ed118353d8dd1f';
const encMinutiae_3 = '625b7097d609ec8f5b48eef448414528e6a78f2f7cdec8352758eb9cfeecb64737d9a94f90725d95fd7d389f682741a50261198865c95a55a8c7a14515d1128cde1c693fdda8583331a064d8bde10d21f4715b12e4af04e6e47aedded3dfbe80ea07e3768e58617df428894467a9088f2c8427d5cd0bb8030064c1b9250d94af03185ff884727697c54ae0bcb64120a937de2bc676daedc83cb6040b2d6d082585f22bcb8cdb09654a3bc4781c873f92827155d9145c1d07554682e3699ff131205482dcafd312ab382c524675f85ca4abc3082cb92dce80ce31ae4997ee8f6677624296d76774c03e63ee83ff7e25926059e0bd25898ec4e23f854e5a29c2d15ae132717b01ad85e982ca3945eb0bcd1c93806499bcc1498b231b887d446d77e2a1b5be00a5570713e4efb43d6cdbab14b18c48289f7d4742d570f39c607e4d19a8eb606bc8caa6b166dfc3f998947c1cfa73465bf38639ae2ff49533f86b07406c35460a2458acbbd931e26f740d4596c898cbcc86678ceaafd1f46abbebbf3ad3c1e55c3a768bbbf3de66a468237fff415dce982c691d0123abf30ca5976b75eb7f3f47fe10f3615a375e03c855c1cc29dd66c0d1607c294f355b18c5295d4a77b74c631a983a1469e22759e2c35401854306f086d5b8c2fb106d098bbce2e4c390ea29f8d33fc9339a29cf390de1de86aedbfaad1ad931111c293b5c8e2f';
const eSkey = '00c35f1fd3e3b761d4c0b318b2c657c0c0348f35a8183f26943545ad424545475c68330f301f05e3319ff2001f82aafbb7f7400e686f42d1a565cee8b57e86249b57001cddb96e545ad796467e884b72b494db1c40d6d73783a8aa1293dac4b90534e995741f696af5bb78a360c04230f51bcbc55069ebac52a8274cd762ef3290e9327ed4df672e3b62ee627615f5a3108cdcf83d102269e69f8d95ef8f26c0eb9b68293504dfcadd1e4642e538a3a560e744e47f26681395813fdd0f7acc6324beda92d5be486c9edacd4555f1a88b268edf44087947594b7b364a0d38618e9647dccd9cc54d3856845e6a3067fd46945b33865a59319b9d5cf651a4fa0b8f';
const iv = '000102030405060708090A0B0C0D0E0F';

describe('POST /redirect/addBioserver', () => {
  it('should add a new Bioserver successfully.', (done) => {
    request(app)
      .post('/redirect/addBioserver')
      .send({bsIP: bioserverIP_1})
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 20005,
          message: 'New bioserver has been saved.'
        });
        expect(res.body.data.bsId).toBe(1);
        expect(res.body.data.version).toBeTruthy();
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        BioserverId.find().then((bioservers) => {
          expect(bioservers.length).toBe(1);
          expect(bioservers[0].bsIP).toBe(bioserverIP_1);
          expect(bioservers[0].bsId).toBe(1);
          expect(bioservers[0].count).toBe(0);
          expect(RedirectData.bioservers.length).toBe(1);
          expect(RedirectData.bioservers[0].bsIP).toBe(bioserverIP_1);
          expect(RedirectData.bioservers[0].bsId).toBe(1);
          expect(RedirectData.bioservers[0].count).toBe(0);
          done();
        }).catch((err) => done(err));
      });
  });

  it('should not add a Bioserver which is already connected.', (done) => {
    request(app)
      .post('/redirect/addBioserver')
      .send({bsIP: bioserverIP_1})
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 40606,
          message: 'This bioserver has already existed.'
        });
        expect(res.body.data).toBeFalsy();
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        BioserverId.find().then((bioservers) => {
          expect(bioservers.length).toBe(1);
          expect(bioservers[0].bsIP).toBe(bioserverIP_1);
          expect(bioservers[0].bsId).toBe(1);
          expect(bioservers[0].count).toBe(0);
          expect(RedirectData.bioservers.length).toBe(1);
          expect(RedirectData.bioservers[0].bsIP).toBe(bioserverIP_1);
          expect(RedirectData.bioservers[0].bsId).toBe(1);
          expect(RedirectData.bioservers[0].count).toBe(0);
          done();
        }).catch((err) => done(err));
      });
  });

  it('should not add a Bioserver which could not be connected.', (done) => {
    request(app)
      .post('/redirect/addBioserver')
      .send({bsIP: bioserverIP_3})
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 40405,
          message: 'Could not connect to the new Bioserver or Bioserver not clean.'
        });
        expect(res.body.data).toBeFalsy();
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        BioserverId.find().then((bioservers) => {
          expect(bioservers.length).toBe(1);
          expect(bioservers[0].bsIP).toBe(bioserverIP_1);
          expect(bioservers[0].bsId).toBe(1);
          expect(bioservers[0].count).toBe(0);
          expect(RedirectData.bioservers.length).toBe(1);
          expect(RedirectData.bioservers[0].bsIP).toBe(bioserverIP_1);
          expect(RedirectData.bioservers[0].bsId).toBe(1);
          expect(RedirectData.bioservers[0].count).toBe(0);
          done();
        }).catch((err) => done(err));
      });
  });

  it('should add a new Bioserver successfully.', (done) => {
    request(app)
      .post('/redirect/addBioserver')
      .send({bsIP: bioserverIP_2})
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 20005,
          message: 'New bioserver has been saved.'
        });
        expect(res.body.data.bsId).toBe(2);
        expect(res.body.data.version).toBeTruthy();
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        BioserverId.find().then((bioservers) => {
          expect(bioservers.length).toBe(2);
          const bioserver_2 = bioservers.find((bioserver) => bioserver.bsIP === bioserverIP_2);
          expect(bioserver_2.bsId).toBe(2);
          expect(bioserver_2.count).toBe(0);
          expect(RedirectData.bioservers.length).toBe(2);
          done();
        }).catch((err) => done(err));
      });
  });

  it('should not add a Bioserver if the required columns not fullfilled.', (done) => {
    request(app)
      .post('/redirect/addBioserver')
      .send({})
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 40603,
          message: 'Required Columns Not Fullfilled.'
        });
        expect(res.body.data).toBeFalsy();
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        BioserverId.find().then((bioservers) => {
          expect(bioservers.length).toBe(2);
          expect(RedirectData.bioservers.length).toBe(2);
          done();
        }).catch((err) => done(err));
      });
  });
});

describe('POST /redirect/enroll', () => {
  it('shoud add a user\'s FP to Bioserver_1 successfully.', (done) => {
    request(app)
      .post('/redirect/enroll')
      .send({
        clientUserId: clientUserId_1,
	      fpIndex: fpIndex_1,
	      encMinutiae: encMinutiae_1,
	      eSkey: eSkey,
	      iv: iv
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 20001,
          message: 'User\'s Finger Data Has Been Saved.'
        });
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        UserFP.find({clientUserId: clientUserId_1, fpIndex: fpIndex_1}).then((userFP) => {
          expect(userFP.length).toBe(1);
          return BioserverId.find({bsIP: bioserverIP_1});
        }).then((bioserver) => {
          expect(bioserver[0].count).toBe(1);
          const bioserver_1 = RedirectData.bioservers.find((bioserver) => bioserver.bsId === 1);
          expect(bioserver_1.count).toBe(1);
          done();
        }).catch((err) => done(err));
      });
  });

  it('shoud not add a FP which is already existed.', (done) => {
    request(app)
      .post('/redirect/enroll')
      .send({
        clientUserId: clientUserId_1,
	      fpIndex: fpIndex_1,
	      encMinutiae: encMinutiae_1,
	      eSkey: eSkey,
	      iv: iv
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 40605,
          message: 'User\'s Finger Data Already Exists.'
        });
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        UserFP.find({clientUserId: clientUserId_1, fpIndex: fpIndex_1}).then((userFP) => {
          expect(userFP.length).toBe(1);
          return BioserverId.find({bsIP: bioserverIP_1});
        }).then((bioserver) => {
          expect(bioserver[0].count).toBe(1);
          const bioserver_1 = RedirectData.bioservers.find((bioserver) => bioserver.bsId === 1);
          expect(bioserver_1.count).toBe(1);
          done();
        }).catch((err) => done(err));
      });
  });

  it('should not add a FP if required columns not fulfilled.', (done) => {
    request(app)
      .post('/redirect/enroll')
      .send({
        clientUserId: clientUserId_1,
        fpIndex: fpIndex_2
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 40603,
          message: 'Required Columns Not Fulfilled.'
        });
        expect(res.body.data).toBeFalsy();
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        UserFP.find({clientUserId: clientUserId_1, fpIndex: fpIndex_1}).then((userFP) => {
          expect(userFP.length).toBe(1);
          return BioserverId.find({bsIP: bioserverIP_1});
        }).then((bioserver) => {
          expect(bioserver[0].count).toBe(1);
          const bioserver_1 = RedirectData.bioservers.find((bioserver) => bioserver.bsId === 1);
          expect(bioserver_1.count).toBe(1);
          done();
        }).catch((err) => done(err));
      });
  });

  it('shoud add a another user\'s FP to Bioserver_2 successfully.', (done) => {
    request(app)
      .post('/redirect/enroll')
      .send({
        clientUserId: clientUserId_2,
	      fpIndex: fpIndex_2,
	      encMinutiae: encMinutiae_2,
	      eSkey: eSkey,
	      iv: iv
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 20001,
          message: 'User\'s Finger Data Has Been Saved.'
        });
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        UserFP.find({clientUserId: clientUserId_2, fpIndex: fpIndex_2}).count().then((count) => {
          expect(count).toBe(1);
          return BioserverId.find({bsIP: bioserverIP_2});
        }).then((bioserver) => {
          expect(bioserver[0].count).toBe(1);
          const bioserver_2 = RedirectData.bioservers.find((bioserver) => bioserver.bsId === 2);
          expect(bioserver_2.count).toBe(1);
          done();
        }).catch((err) => done(err));
      });
  });
});

describe('POST /redirect/verify', () => {
  it('should verify a user successfully', (done) => {
    request(app)
      .post('/redirect/verify')
      .send({
        clientUserId: clientUserId_2,
	      encMinutiae: encMinutiae_2,
	      eSkey: eSkey,
	      iv: iv
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 20003,
          message: 'User is Verified.',
        });
        expect(typeof res.body.data.score).toBe('number');
        expect(res.body.data.fpIndex).toBe(fpIndex_2);
      })
      .end(done);
  });

  it('should be failed when a FP is not matched.', (done) => {
    request(app)
      .post('/redirect/verify')
      .send({
        clientUserId: clientUserId_1,
	      encMinutiae: encMinutiae_3,
	      eSkey: eSkey,
	      iv: iv
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 40301,
          message: 'Finger Data is Not Matched.'
        });
        expect(res.body.data).toBeFalsy();
      })
      .end(done);
  });

  it('should be failed when the user has not enrolled yet.', (done) => {
    request(app)
      .post('/redirect/verify')
      .send({
        clientUserId: clientUserId_3,
	      encMinutiae: encMinutiae_3,
	      eSkey: eSkey,
	      iv: iv
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 40302,
          message: 'The User Has Not Enrolled Yet.'
        });
        expect(res.body.data).toBeFalsy();
      })
      .end(done);
  });

  it('should not verify a FP if required columns not fulfilled.', (done) => {
    request(app)
      .post('/redirect/verify')
      .send({userId: clientUserId_1})
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 40603,
          message: 'Required Columns Not Fulfilled.'
        });
        expect(res.body.data).toBeFalsy();
      })
      .end(done);
  });
});

describe('POST /redirect/identify', () => {
  it('should identify a user successfully.', (done) => {
    request(app)
      .post('/redirect/identify')
      .send({
	      encMinutiae: encMinutiae_2,
	      eSkey: eSkey,
	      iv: iv
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 20004,
          message: 'User is Identified.'
        });
        expect(typeof res.body.data.score).toBe('number');
        expect(res.body.data.fpIndex).toBe(fpIndex_2);
        expect(res.body.data.clientUserId).toBe(clientUserId_2);
      })
      .end(done);
  });

  it('should be failed when no user identified with the FP.', (done) => {
    request(app)
      .post('/redirect/identify')
      .send({
	      encMinutiae: encMinutiae_3,
	      eSkey: eSkey,
	      iv: iv
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 40403,
          message: 'No User Identified with The Given Finger Data'
        });
        expect(res.body.data).toBeFalsy();
      })
      .end(done);
  });

  it('should not identify a user if required columns not fulfilled.', (done) => {
    request(app)
      .post('/redirect/identify')
      .send({userId: clientUserId_1})
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 40603,
          message: 'Required Columns Not Fulfilled.'
        });
        expect(res.body.data).toBeFalsy();
      })
      .end(done);
  });
});

describe('POST /redirect/delete', () => {
  it('just adds one more user_1\'s FP to Bioserver_1 for further tests.', (done) => {
    request(app)
      .post('/redirect/enroll')
      .send({
        clientUserId: clientUserId_1,
	      fpIndex: fpIndex_3,
	      encMinutiae: encMinutiae_3,
	      eSkey: eSkey,
	      iv: iv
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 20001,
          message: 'User\'s Finger Data Has Been Saved.'
        });
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        UserFP.find({clientUserId: clientUserId_1}).count().then((count) => {
          expect(count).toBe(2);
          return BioserverId.find({bsIP: bioserverIP_1});
        }).then((bioserver) => {
          expect(bioserver[0].count).toBe(2);
          const bioserver_1 = RedirectData.bioservers.find((bioserver) => bioserver.bsId === 1);
          expect(bioserver_1.count).toBe(2);
          done();
        }).catch((err) => done(err));
      });
  });

  it('just adds one more user_2\'s FP to Bioserver_2 for further tests.', (done) => {
    request(app)
      .post('/redirect/enroll')
      .send({
        clientUserId: clientUserId_2,
	      fpIndex: fpIndex_3,
	      encMinutiae: encMinutiae_3,
	      eSkey: eSkey,
	      iv: iv
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 20001,
          message: 'User\'s Finger Data Has Been Saved.'
        });
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        UserFP.find({clientUserId: clientUserId_2}).count().then((count) => {
          expect(count).toBe(2);
          return BioserverId.find({bsIP: bioserverIP_2});
        }).then((bioserver) => {
          expect(bioserver[0].count).toBe(2);
          const bioserver_2 = RedirectData.bioservers.find((bioserver) => bioserver.bsId === 2);
          expect(bioserver_2.count).toBe(2);
          done();
        }).catch((err) => done(err));
      });
  });

  it('shoud delete a user\'s FP successfully.', (done) => {
    request(app)
      .post('/redirect/delete')
      .send({
        clientUserId: clientUserId_1,
	      fpIndex: fpIndex_1
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 20002,
          message: 'User\'s Finger Data With the Specified Index Has Been Deleted.',
        });
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        UserFP.find({clientUserId: clientUserId_1}).then((userFPs) => {
          expect(userFPs.length).toBe(1);
          expect(userFPs[0].fpIndex).toBe(fpIndex_3);
          return BioserverId.find({bsIP: bioserverIP_1});
        }).then((bioserver) => {
          expect(bioserver[0].count).toBe(1);
          const bioserver_1 = RedirectData.bioservers.find((bioserver) => bioserver.bsId === 1);
          expect(bioserver_1.count).toBe(1);
          done();
        }).catch((err) => done(err));
      });
  });

  it('shoud delete a user\'s another FP successfully.', (done) => {
    request(app)
      .post('/redirect/delete')
      .send({
        clientUserId: clientUserId_1,
	      fpIndex: fpIndex_3
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 20002,
          message: 'User\'s Finger Data With the Specified Index Has Been Deleted.',
        });
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        UserFP.find({clientUserId: clientUserId_1}).then((userFP) => {
          expect(userFP.length).toBe(0);
          return BioserverId.find({bsIP: bioserverIP_1});
        }).then((bioserver) => {
          expect(bioserver[0].count).toBe(0);
          const bioserver_1 = RedirectData.bioservers.find((bioserver) => bioserver.bsId === 1);
          expect(bioserver_1.count).toBe(0);
          done();
        }).catch((err) => done(err));
      });
  });

  it('should not delete a FP which dose not exist.', (done) => {
    request(app)
      .post('/redirect/delete')
      .send({
        clientUserId: clientUserId_2,
	      fpIndex: fpIndex_1
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 40404,
          message: 'The Specified User Id and FP Index Number Does Not Exist.'
        });
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        UserFP.find({clientUserId: clientUserId_2}).count().then((count) => {
          expect(count).toBe(2);
          return BioserverId.find({bsIP: bioserverIP_2});
        }).then((bioserver) => {
          expect(bioserver[0].count).toBe(2);
          const bioserver_2 = RedirectData.bioservers.find((bioserver) => bioserver.bsId === 2);
          expect(bioserver_2.count).toBe(2);
          done();
        }).catch((err) => done(err));
      });
  });

  it('shoud delete a user\'s all FPs successfully.', (done) => {
    request(app)
      .post('/redirect/delete')
      .send({
        clientUserId: clientUserId_2,
	      fpIndex: 0
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 20006,
          message: 'User\'s Finger Data Has Been All Deleted.',
        });
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        UserFP.find({clientUserId: clientUserId_2}).then((userFPs) => {
          expect(userFPs.length).toBe(0);
          return BioserverId.find({bsIP: bioserverIP_2});
        }).then((bioserver) => {
          expect(bioserver[0].count).toBe(0);
          const bioserver_2 = RedirectData.bioservers.find((bioserver) => bioserver.bsId === 2);
          expect(bioserver_2.count).toBe(0);
          done();
        }).catch((err) => done(err));
      });
  });

  it('should not delete a FP if required columns not fulfilled.', (done) => {
    request(app)
      .post('/redirect/delete')
      .send({fpIndex: fpIndex_2})
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          code: 40603,
          message: 'Required Columns Not Fulfilled.'
        });
      })
      .end(done);
  });
});

describe('Clean up the database.', () => {
  it('should clean up the database.', (done) => {
    BioserverId.remove({}).then((result) => {
      expect(result.result.ok).toBe(1);
      done();
    }).catch((err) => done(err));
  });
});
