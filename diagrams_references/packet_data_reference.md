# STS Instrument packet reference

This is a reference document, describing all packet topics and their contents.
Endpoints usually fall in these catagories:
 - Server
 - Instrument
 - Controller

## Server

The endpoint that records all messages in a queue and manages experiment sequentialism.

## Instrument

An endpoint capable of recording some measurements. May also be able to move the stage.

## Controller

An endpoint usually having a GUI or CLI for user interaction. Typically orders the server to inform Instruments of taking measurments

## Reference types and structs

### `Point`
|||
|-|-|
|`x`|`int`|
|`y`|`int`|
|`z`|`int`|


## Topics



### `instrument_ping`
Informational packet asking for all instruments to respond with `instrument_data`.

Usually sent only by the server. 

#### Body:
|Field|Type|Description|
|-|-|-|
|-|-|No fields are present at this time|

### `instrument_data`
A response to `instrument_ping`.
Informs the server about the instrument, it's place in the sequence and wether it's a priority instrument. Priority instruments include the stage controller and the primary measurement device. Other things such as cameras may be set as priority if visual representation is necessary for data inspection or analysis.

Usually sent only by instruments.

#### Body:
|Field|Type|Description|
|-|-|-|
|`priority`|`bool`|Describes wether the instrument considers itself as priority.|
|`name`|`string`|Name of the instrument, it should be unique to prevent confusion. Duplicate names lead to undefined behaviour.|
|`sequence`|`int`|Describes the sequence number that the instrument considers to be the best fit.|
|`local_cal`|`[bool,bool,bool]`|A list of 3 booleans denoting if local points `A`, `B`, `C` are set.|
|`dataset_cal`|`[bool,bool,bool]`|A list of 3 booleans denoting if local points `A`, `B`, `C` are set.|

### `measure`
A server emmited packet that orders all instruments that fit the sequence to cunduct their measurements.
Usually sent only by the server.

Instruments may send the packet `uncalibrated` in case where local or dataset calibration points are not set.

#### Body:
|Field|Type|Description|
|-|-|-|
|`experimentId`|`int`|The id of the currently cunducted experiment. Used for providing correct data for file uploads.|
|`pointNumber`|`int`|The current point number. Used for providing correct data for file uploads.|
|`sequence`|`int`|The current sequence number.|
|`point`|[`Point`](#point)|The coordinates of the point in question.|

### `ready`

A response to `measure` signifying that the instrument has completed its measurements. The server will wait for priority instruments to emit the `ready` packet before moving on.
Non-priority instrument `ready` packets will be ignored.

Usually sent by Instruments

#### Body:
|Field|Type|Description|
|-|-|-|
|`sequence`|`int`|The sequence number of the instrument|
|`name`|`string`|The name of the instrument. This must be the same as the name supplied in the `instrument_data` packet.|

### `calibration`

A packet informing instruments about the original dataset's calibration points.

Sent by the server before starting the experiment to translate the experiment points to local points.
Must be sent before issuing any `measure` commands.

#### Body:

|Field|Type|Description|
|-|-|-|
|`A`|[`Point`](#point)|Calibration point A.|
|`B`|[`Point`](#point)|Calibration point B.|
|`C`|[`Point`](#point)|Calibration point C.|

### `point_info?` and `point_info`

A topic pair for communication with stage-enabled Instruments and Controllers.

`point_info?` is issued by a Controller type endpoint with an empty body.

In response, a `point_info` packet is sent by the stage-enabled instrument.

#### `point_info` Body:

|Field|Type|Description|
|-|-|-|
|`x`|`int`|The current x coordinate.|
|`y`|`int`|The current y coordinate.|
|`z`|`int`|The current z coordinate.|

### `set_local_calibration`

A controller issued packet informing the stage-enabled instrument that the current location is a local calibration point.

#### Body:

|Field|Type|Description|
|-|-|-|
|`point`|`"A" \| "B" \| "C"`|Denotes the calibration point that the stage is at.|

### `data_move`

Controller issued packet instructing the stage-enabled instrument to move to the given coordinates.
__Coordinates are in dataset space, not instrument space.__

Sends `uncalibrated` if calibration points are not complete.

#### Body:

|Field|Type|Description|
|-|-|-|
|`x`|`int`|The current x coordinate.|
|`y`|`int`|The current y coordinate.|
|`z`|`int`|The current z coordinate.|


### `move`

Controller issued packet instructing the stage-enabled instrument to move to the given coordinates.
__Coordinates are in instrument space, not dataset space.__

#### Body:

|Field|Type|Description|
|-|-|-|
|`x`|`int`|The current x coordinate.|
|`y`|`int`|The current y coordinate.|
|`z`|`int`|The current z coordinate.|


### `uncalibrated`

Stage-enabled instrument issued response used to signify that it is not ready to accept any global movement commands because of lack of calibration information.

#### Body:

|Field|Type|Description|
|-|-|-|
|`name`|`string`|Name of the instrument.|
|`local`|`[bool,bool,bool]`|A list of 3 booleans denoting if local calibration points `A`, `B`, `C` are set.|
|`dataset`|`[bool,bool,bool]`|A list of 3 booleans denoting if dataset calibration points `A`, `B`, `C` are set.|


