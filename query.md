PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX p: <http://dbpedia.org/property/>          
SELECT * WHERE {
      ?player p:currentclub  <http://dbpedia.org/resource/Manchester_United_F.C.>.
      OPTIONAL {?player p:dateOfBirth ?dob}.
      OPTIONAL {?player p:position ?position}.
      OPTIONAL {?player p:image ?image}.
   }
