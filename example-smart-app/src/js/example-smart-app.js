(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', //height
                              'http://loinc.org|3137-7',
                              'http://loinc.org|29463-7', //weight
                              'http://loinc.org|3141-9',
                             'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 
                              'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 
                              'http://loinc.org|55284-4']
                      }
                    }
                  });
        var meds = smart.patient.api.fetchAll({
                    type: 'MedicationOrder',//Medication; ; MedicationStatement; MedicationDispense,MedicationAdministration
                    query: {
                      code: {
                        $or: [
                          'https://loinc.org/52471-0/',//medicaton
                          'https://loinc.org/57833-6/',//prescription
                          'https://loinc.org/52418-1/',//	Medication Name
                          'https://loinc.org/80565-5/',//MedicationAdministration
                          'https://loinc.org/87232-5/',
                        ]

                      }
                        
                    }                            
                });

        $.when(pt, obv).fail(onError);

        $.when(pt, obv).done(function(patient, obv) {
          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;

          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family.join(' ');
          }

          var height = byCodes('8302-2', '3137-7');
          var weight= byCodes('29463-7', '3141-9');

          var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');
          
          var drug = byMedsCodes('87232-5','80565-5');
          console.log(drug)


          // define p patient 
          var p = defaultPatient();

          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;

          //hieght weight
          p.height = getQuantityValueAndUnit(height[0]);
          p.weigth = getQuantityValueAndUnit(weight[0]);
            //p.weight=JSON.stringify(weight[0])
          //bmi
          p.bmi = (getQuantityValue(weight[0]) / (Math.pow((getQuantityValue(height[0]) / 100), 2))).toFixed(1);

          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
           //p.hdl=JSON.stringify(hdl[0])

          p.ldl = getQuantityValueAndUnit(ldl[0]);

          ret.resolve(p);
        });
      } else {
        onError();
      }
    }


    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      weigth:{value: ''},
      bmi: {value:''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }


//value & unit
  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;//its fine to add .toFixed(1)
    } else {
      return undefined;
    }
  }



////////////why
  //// Get numerical value 

    // Get only numerical value of observations
    function getQuantityValue(ob) {

      if (typeof ob != 'undefined' &&
          typeof ob.valueQuantity != 'undefined' &&
          typeof ob.valueQuantity.value != 'undefined') {

          return ob.valueQuantity.value;

      } else {
          return undefined;
      }
  }




  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#weight').html(p.weight);
    $('#bmi').html(p.bmi);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
  };

})(window);
