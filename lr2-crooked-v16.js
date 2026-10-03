(() => {
  /* LR3.15 compatibility shim.
     The old Crooked Tom test created/modified a real inventory card, which made
     the tester behave differently from normal cards. Testing now lives in
     LR3TestLab and uses temporary card instances only. */
  window.LR216CrookedTom={
    ensure:()=>null,
    showFlipTest:()=>window.LR3TestLab?.showHoloTest?.('galaxy'),
    uid:null
  };
})();
